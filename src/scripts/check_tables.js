
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkcmfurhbheasaqjhnj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjQxMTYsImV4cCI6MjA4ODA0MDExNn0.mfNorjHzMEss4BA3K7S8-Qppxxei8hKcWwE7EQTs90Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
    const { data, error } = await supabase.from('usuarios').select('*').limit(1);
    if (error) {
        console.log('Erro ao buscar usuarios:', error.message);
    } else {
        console.log('Tabela usuarios existe.');
    }

    const { data: schools, error: schoolError } = await supabase.from('escolas').select('*').limit(1);
    if (schoolError) {
        console.log('Erro ao buscar escolas:', schoolError.message);
    } else {
        console.log('Tabela escolas existe.');
    }
}

checkTable();
