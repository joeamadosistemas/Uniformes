import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkcmfurhbheasaqjhnj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjQxMTYsImV4cCI6MjA4ODA0MDExNn0.mfNorjHzMEss4BA3K7S8-Qppxxei8hKcWwE7EQTs90Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    const tables = ['profiles', 'escolas', 'uniformes', 'uniformes_catalogo', 'estoque', 'transferencias', 'movimentacoes'];

    console.log('--- Verificando Tabelas ---');
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ ${table}: ${error.message}`);
        } else {
            console.log(`✅ ${table}: Existe`);
        }
    }
}

checkTables();
