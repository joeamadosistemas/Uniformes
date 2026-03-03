import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkcmfurhbheasaqjhnj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ2NDExNiwiZXhwIjoyMDg4MDQwMTE2fQ.jKO27Ftqu4GoYNVpDUkdqR1yJ2oRaGzluaS6D9f98ro';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
    console.log('--- Listando Tabelas do Schema Public ---');

    // Tentativa de ler de escolas
    const { data: schools, error: schoolError } = await supabase.from('escolas').select('*').limit(1);
    if (schoolError) console.log('Tabela "escolas" NÃO existe ou erro:', schoolError.message);
    else console.log('Tabela "escolas" existe.');

    // Tentativa de ler de uniformes
    const { data: uniforms, error: uniformError } = await supabase.from('uniformes').select('*').limit(1);
    if (uniformError) console.log('Tabela "uniformes" NÃO existe ou erro:', uniformError.message);
    else console.log('Tabela "uniformes" existe.');

    // Tentativa de ler de lancamentos
    const { data: lancamentos, error: lancError } = await supabase.from('lancamentos').select('*').limit(1);
    if (lancError) console.log('Tabela "lancamentos" NÃO existe ou erro:', lancError.message);
    else console.log('Tabela "lancamentos" existe.');
}

listTables();
