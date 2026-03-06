import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://zlkcmfurhbheasaqjhnj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjQxMTYsImV4cCI6MjA4ODA0MDExNn0.mfNorjHzMEss4BA3K7S8-Qppxxei8hKcWwE7EQTs90Q'
);

(async () => {
    try {
        const { data: escola, error: errEscola } = await supabase
            .from('escolas')
            .select('nome, segmentos')
            .eq('email', 'cm.senadorteotoniovilella@edu.itaguai.rj.gov.br')
            .single();

        if (errEscola) {
            console.error('Erro ao buscar escola:', errEscola);
        } else {
            console.log('--- ESCOLA ---');
            console.log('Nome:', escola.nome);
            console.log('Segmentos:', escola.segmentos);
        }

        const { data: modelos, error: errModelos } = await supabase
            .from('modelos_recebimento')
            .select('id, nome, segmentos');

        if (errModelos) {
            console.error('Erro ao buscar modelos:', errModelos);
        } else {
            const result = {
                escola,
                modelos
            };
            const fs = await import('fs');
            fs.writeFileSync('modelos_data.json', JSON.stringify(result, null, 2));
            console.log('Dados salvos em modelos_data.json');
        }
    } catch (e) {
        console.error('Erro inesperado:', e);
    }
})();
