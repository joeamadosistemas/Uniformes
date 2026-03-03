
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkcmfurhbheasaqjhnj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjQxMTYsImV4cCI6MjA4ODA0MDExNn0.mfNorjHzMEss4BA3K7S8-Qppxxei8hKcWwE7EQTs90Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEscolasColumns() {
    const { data, error } = await supabase.from('escolas').select('*').limit(1);
    if (error) {
        console.error('Erro:', error.message);
    } else if (data && data.length > 0) {
        console.log('Colunas em escolas:', Object.keys(data[0]));
    } else {
        console.log('Tabela escolas vazia ou não acessível para ver colunas.');
    }
}

checkEscolasColumns();
