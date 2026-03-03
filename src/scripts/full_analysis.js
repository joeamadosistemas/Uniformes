import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkcmfurhbheasaqjhnj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ2NDExNiwiZXhwIjoyMDg4MDQwMTE2fQ.jKO27Ftqu4GoYNVpDUkdqR1yJ2oRaGzluaS6D9f98ro';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjQxMTYsImV4cCI6MjA4ODA0MDExNn0.mfNorjHzMEss4BA3K7S8-Qppxxei8hKcWwE7EQTs90Q';

const admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function fullAnalysis() {
    console.log('='.repeat(60));
    console.log('ANÁLISE COMPLETA DO SUPABASE');
    console.log('='.repeat(60));

    // 1. Listar todos os usuários
    const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) { console.error('Erro:', error.message); return; }

    console.log(`\n[AUTH] Total de usuários: ${users.length}`);

    // 2. Mostrar todos os usuários com status
    console.log('\n[AUTH] Lista de usuários:');
    users.forEach(u => {
        const confirmed = u.email_confirmed_at ? '✅' : '❌';
        const lastLogin = u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('pt-BR') : 'nunca';
        console.log(`  ${confirmed} ${u.email} | Último login: ${lastLogin} | ID: ${u.id.substring(0, 8)}...`);
    });

    // 3. Verificar tabelas disponíveis
    console.log('\n[TABELAS] Verificando tabelas:');
    const tables = ['profiles', 'escolas', 'uniformes', 'lancamentos', 'transferencias'];
    for (const t of tables) {
        const { error: te } = await admin.from(t).select('*').limit(1);
        console.log(`  ${te ? '❌' : '✅'} ${t}${te ? ' — ' + te.message.substring(0, 60) : ''}`);
    }

    // 4. Testar login com credenciais
    console.log('\n[LOGIN] Testando credenciais:');
    const testCreds = [
        { email: 'em.eiderribeirodantas@edu.itaguai.rj.gov.br', password: 'Admin@2026' },
    ];

    const anon = createClient(supabaseUrl, supabaseAnonKey);
    for (const cred of testCreds) {
        const { data, error: le } = await anon.auth.signInWithPassword(cred);
        if (le) {
            console.log(`  ❌ ${cred.email} — ${le.message} (status: ${le.status})`);
        } else {
            console.log(`  ✅ ${cred.email} — Login OK!`);
            await anon.auth.signOut();
        }
    }
}

fullAnalysis();
