const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { databaseContext, prompt } = await req.json()

    // Pegar a chave configurada no painel do Supabase (oculta do front)
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      throw new Error('Servidor não está configurado com a chave do Gemini')
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${databaseContext}\n\nINSTRU\u00c7\u00c3O:\n${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini error:', errorText)
      throw new Error(`Google API falhou (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    let aiResponse = ''
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      aiResponse = data.candidates[0].content.parts[0].text
    } else {
      throw new Error('Formato de resposta inesperado do Gemini')
    }

    // Parse dos insights
    const parsedInsights = aiResponse
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.startsWith('-'))
      .map((line: string) => line.replace(/^- /, ''))

    if (parsedInsights.length === 0) {
      return new Response(JSON.stringify({ insights: ['A IA não conseguiu gerar insights no formato correto.'] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ insights: parsedInsights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Edge function erro:', errorMessage)
    // Retornamos 200 com { error: ... } para que o frontend do Supabase possa ler o JSON sem explodir um erro opaco 400
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
