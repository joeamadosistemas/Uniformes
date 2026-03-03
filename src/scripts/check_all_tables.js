import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkcmfurhbheasaqjhnj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ2NDExNiwiZXhwIjoyMDg4MDQwMTE2fQ.jKO27Ftqu4GoYNVpDUkdqR1yJ2oRaGzluaS6D9f98ro';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAllTables() {
    const tables = [
        'escolas',
        'uniformes',
        'uniformes_catalogo',
        'lancamentos',
        'recebimentos',
        'recebimentos_registros',
        'profiles',
        'Profile',
        'transferencias'
    ];
    for (const t of tables) {
        try {
            const { error: e } = await supabase.from(t).select('*').limit(0);
            if (!e) console.log(`[OK] Tabela "${t}" EXISTE.`);
            else if (e.code === '42P01') console.log(`[ERRO] Tabela "${t}" NÃO existe.`);
            else console.log(`[?] Tabela "${t}" erro (${e.code}): ${e.message}`);
        } catch (err) {
            console.log(`[EXC] Tabela "${t}" exceção: ${err.message}`);
        }
    }
}

getAllTables();
