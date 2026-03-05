import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Sparkles, AlertCircle, TrendingUp } from 'lucide-react';

export const AIInsightsCard: React.FC = () => {
    const [insights, setInsights] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch raw data from Supabase directly
            const [{ data: escolas }, { data: recebimentosData }, { data: estoqueData }] = await Promise.all([
                supabase.from('escolas').select('nome, ativo'),
                supabase.from('uniformes_entregues').select('escola, quantidade'),
                supabase.from('estoque_uniformes').select('descricao, tamanho, quantidade')
            ]);

            const recebimentos = recebimentosData || [];
            const estoques = estoqueData || [];
            const escolasAtivas = (escolas || []).filter(e => e.ativo);

            const escolasInformaram = new Set(recebimentos.map(r => r.escola));
            const pendentes = escolasAtivas.filter(e => !escolasInformaram.has(e.nome)).map(e => e.nome);

            const stockSummary = estoques.reduce((acc, curr) => {
                const key = `${curr.descricao} (${curr.tamanho})`;
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
Você é o UniControl AI, analisador logístico.
DADOS ATUAIS:
- Total Escolas Ativas: ${escolasAtivas.length}
- Total Distribuído: ${totalDistrib}
- Total Estoque: ${totalStock}
- Escolas Pendentes de Recebimento (${pendentes.length}): ${pendentes.join(', ')}
- Distribuição Top: ${Object.entries(distribSummary).map(([esc, qtd]) => `${esc}: ${qtd}`).join(', ')}
- Estoque: ${Object.entries(stockSummary).map(([tipo, qtd]) => `${tipo}: ${qtd}`).join(', ')}
`;

            const prompt = `Gere exatamente 3 insights curtos e diretos sobre a situação atual de uniformes, baseando-se nos dados reais. Exemplo de temas: escolas que não registraram, quantidade do item com maior estoque, escola que mais recebeu.
Regras estritas:
1. Retorne APENAS 3 linhas, cada uma começando com o caractere "-" e um espaço.
2. Não adicione nenhum cabeçalho, saudação ou explicação.
3. Não use formatação markdown de negrito.`;

            const messagesForAI = [
                { role: 'system', content: databaseContext },
                { role: 'user', content: prompt }
            ];


            // 2. Fetch from Supabase Edge Function directly
            const { data, error } = await supabase.functions.invoke('generate-insights', {
                body: {
                    databaseContext: messagesForAI[0].content,
                    prompt: messagesForAI[1].content
                }
            });

            if (error) {
                console.error('Edge function falhou:', error);
                throw new Error(`Falha na IA Logística (Rede): ${error.message || 'Erro desconhecido ao chamar Edge Function'}`);
            }

            if (data?.error) {
                console.error('Edge Function retornou erro interno:', data.error);
                throw new Error(`Falha na IA Logística: ${data.error}`);
            }

            if (!data || !data.insights || data.insights.length === 0) {
                setInsights(['A IA não conseguiu gerar insights no formato esperado.']);
            } else {
                setInsights(data.insights);
            }

        } catch (err: any) {
            console.error('AI Insights Error:', err);
            setError(err.message || 'Erro ao comunicar com a IA.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-[#0F3D63] to-[#123E67] dark:from-zinc-900/80 dark:to-blue-900/20 dark:backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden mb-6 relative border border-[#123E67]/50 dark:border-white/5">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

            <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Header section */}
                <div className="flex-shrink-0 w-full md:w-1/3 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-[#F4B942]/20 p-2.5 rounded-xl backdrop-blur-sm self-start">
                            <Sparkles className="text-[#F4B942] w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-white">
                                UniControl AI
                            </h3>
                            <p className="text-[#FFD166] text-sm font-medium tracking-wide">
                                INSIGHTS LOGÍSTICOS
                            </p>
                        </div>
                    </div>
                    <p className="text-blue-100/80 text-sm mt-2 leading-relaxed hidden md:block max-w-[250px]">
                        Análise em tempo real baseada em inteligência artificial sobre a distribuição e o estoque atual.
                    </p>
                </div>

                {/* Divider Line Mobile */}
                <div className="h-px w-full bg-blue-400/20 md:hidden"></div>

                {/* Divider Line Desktop */}
                <div className="hidden md:block w-px h-24 bg-blue-400/20 mx-4"></div>

                {/* Content section */}
                <div className="flex-1 w-full">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            <div className="flex space-x-1.5">
                                <span className="w-2.5 h-2.5 bg-[#FFD166] rounded-full animate-bounce"></span>
                                <span className="w-2.5 h-2.5 bg-[#FFD166] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2.5 h-2.5 bg-[#FFD166] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                            <p className="text-sm font-medium text-blue-200 animate-pulse">Consultando dados no Supabase e gerando panorama...</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-200">
                            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                            <p className="text-sm leading-relaxed text-red-100">{error}</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {insights.map((insight, index) => (
                                <li key={index} className="flex gap-3 text-blue-50/90 items-start">
                                    <div className="mt-1 flex-shrink-0 bg-blue-500/20 rounded-full p-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-[#FFD166]" />
                                    </div>
                                    <span className="text-[15px] leading-relaxed font-medium">
                                        {insight.replace(/\*\*/g, '') /* Remove markdown bold just in case it leaks through */}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            {/* Small reload button overlay just in case they want fresh insights */}
            {!loading && !error && (
                <button
                    onClick={fetchInsights}
                    className="absolute top-4 right-4 text-blue-200/50 hover:text-white transition-colors p-2"
                    title="Atualizar Insights"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                    </svg>
                </button>
            )}
        </div>
    );
};
