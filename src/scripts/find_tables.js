
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkcmfurhbheasaqjhnj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjQxMTYsImV4cCI6MjA4ODA0MDExNn0.mfNorjHzMEss4BA3K7S8-Qppxxei8hKcWwE7EQTs90Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
    // RPC is usually needed to list tables if not exposing schema
    // But maybe I can just try some names
    const possibleNames = ['usuarios', 'perfis', 'profiles', 'diretores', 'users_profiles'];
    for (const name of possibleNames) {
        const { error } = await supabase.from(name).select('*').limit(1);
        if (!error) {
            console.log(`Tabela encontrada: ${name}`);
        } else {
            console.log(`Tabela ${name} não encontrada: ${error.message}`);
        }
    }
}

listTables();
