import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Used to bypass RLS for data aggregation, or we could use the user Auth token
    );

    // Extract user token to verify authentication
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) {
      throw new Error('Authentication required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { message, history = [] } = await req.json();

    // 1. Fetch live context from database (Summarized)
    const [
      { data: escolasData },
      { data: recebimentosData },
      { data: estoqueData }
    ] = await Promise.all([
      supabaseClient.from('escolas').select('nome, segmentos, ativo'),
      supabaseClient.from('recebimentos').select('escola, modelo_nome, quantidade, tamanho'),
      supabaseClient.from('uniformes_catalogo').select('modelo, descricao, quantidade, tamanho')
    ]);

    const escolas = escolasData || [];
    const recebimentos = recebimentosData || [];
    const estoques = estoqueData || [];

    const escolasInformaram = new Set(recebimentos.map(r => r.escola));
    const pendentes = escolas.filter(e => e.ativo && !escolasInformaram.has(e.nome)).map(e => e.nome);

    // Simplify data to fit in prompt
    const stockSummary = estoques.reduce((acc, curr) => {
      const key = `${curr.descricao} (Tam: ${curr.tamanho})`;
      acc[key] = (acc[key] || 0) + curr.quantidade;
      return acc;
    }, {} as Record<string, number>);

    const distribSummary = recebimentos.reduce((acc, curr) => {
      acc[curr.escola] = (acc[curr.escola] || 0) + curr.quantidade;
      return acc;
    }, {} as Record<string, number>);

    const totalDistrib = recebimentos.reduce((acc, curr) => acc + curr.quantidade, 0);
    const totalStock = estoques.reduce((acc, curr) => acc + curr.quantidade, 0);

    const databaseContext = `
Você é o UniControl AI, o assistente inteligente do Sistema de Gestão de Uniformes Escolares da Secretaria Municipal de Educação de Itaguaí.
Sua missão é responder às perguntas dos gestores sobre a logística de uniformes com base SOMENTE nos dados reais extraídos do banco de dados (Supabase) abaixo.

DADOS ATUAIS DO SISTEMA:
- Total de Escolas Cadastradas Ativas: ${escolas.filter(e => e.ativo).length}
- Total de Uniformes Distribuídos: ${totalDistrib}
- Total em Estoque Atual: ${totalStock}
- Escolas Pendentes de Recebimento (${pendentes.length}): ${pendentes.join(', ')}

Distribuição Mapeada por Escola (Top 10 ou resumo):
${Object.entries(distribSummary).map(([esc, qtd]) => `- ${esc}: ${qtd} itens`).join('\n')}

Estoque Disponível Mapeado por Tipo/Tamanho:
${Object.entries(stockSummary).map(([tipo, qtd]) => `- ${tipo}: ${qtd} disponíveis`).join('\n')}

REGRA: 
1. Responda APENAS baseado nos dados acima. Se não souber ou o dado não estiver presente, diga que não tem essa informação no momento.
2. Seja prestativo, claro e objetivo.
3. Fale português do Brasil de forma profissional.
4. Caso perguntem "qual escola recebeu mais", você pode visualizar o 'Distribuição Mapeada' acima para responder.
`;

    const messagesForAI = [
      { role: 'system', content: databaseContext },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    let aiResponse = '';

    // Try Groq First
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: messagesForAI,
          temperature: 0.2
        })
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        aiResponse = data.choices[0].message.content;
      } else {
        throw new Error('Groq failed');
      }
    } catch (groqError) {
      console.error('Groq failed, falling back to OpenRouter:', groqError);

      // Fallback to OpenRouter (e.g. Meta Llama 3 8B or similar open model if default is unset)
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sme-itaguai-uniformes.netlify.app',
          'X-Title': 'UniControl Dashboard'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct:free',
          messages: messagesForAI,
          temperature: 0.2
        })
      });

      if (orRes.ok) {
        const data = await orRes.json();
        aiResponse = data.choices[0].message.content;
      } else {
        const err = await orRes.text();
        console.error("Open router err: ", err)
        throw new Error('Both AI providers failed');
      }
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Retorna status 200 com a string de erro para não invocar os erros genéricos do Supabase JS e permitir o debug na interface.
    return new Response(JSON.stringify({ error: error.message || 'Unknown error occurred in Edge Function', stack: error.stack }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
