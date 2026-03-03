import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkcmfurhbheasaqjhnj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ2NDExNiwiZXhwIjoyMDg4MDQwMTE2fQ.jKO27Ftqu4GoYNVpDUkdqR1yJ2oRaGzluaS6D9f98ro';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TARGET_USER_ID = 'ceb77964-c976-41d0-b53d-29491b7f1798';
const NEW_PASSWORD = 'Admin@2026';

async function resetPassword() {
    console.log('=== Redefinindo senha do admin ===');
    console.log(`ID: ${TARGET_USER_ID}`);
    console.log(`Nova Senha: ${NEW_PASSWORD}`);

    // Primeiro, verificar estado atual do usuário
    const { data: userBefore, error: fetchError } = await supabase.auth.admin.getUserById(TARGET_USER_ID);
    if (fetchError) {
        console.error('Erro ao buscar usuário:', fetchError.message);
        return;
    }
    console.log('\nEstado atual do usuário:');
    console.log(`  Email: ${userBefore.user.email}`);
    console.log(`  Email confirmado: ${userBefore.user.email_confirmed_at ? 'SIM' : 'NÃO'}`);
    console.log(`  Último login: ${userBefore.user.last_sign_in_at || 'nunca'}`);

    // Redefinir senha
    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
        TARGET_USER_ID,
        {
            password: NEW_PASSWORD,
            email_confirm: true
        }
    );

    if (updateError) {
        console.error('\n❌ Erro ao redefinir senha:', updateError.message);
        return;
    }

    console.log('\n✅ Senha redefinida com sucesso!');
    console.log(`   Email: ${updated.user.email}`);
    console.log(`   Email confirmado: ${updated.user.email_confirmed_at ? 'SIM' : 'NÃO'}`);

    // Tentar login para confirmar que a senha está correta
    console.log('\n--- Testando login com a nova senha ---');
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjQxMTYsImV4cCI6MjA4ODA0MDExNn0.mfNorjHzMEss4BA3K7S8-Qppxxei8hKcWwE7EQTs90Q';
    const clientAnon = createClient(supabaseUrl, anonKey);

    const { data: signIn, error: signInError } = await clientAnon.auth.signInWithPassword({
        email: updated.user.email,
        password: NEW_PASSWORD
    });

    if (signInError) {
        console.error('❌ Teste de login FALHOU:', signInError.message);
        console.log('   Status:', signInError.status);
    } else {
        console.log('✅ Teste de login PASSOU!');
        console.log(`   Usuário autenticado: ${signIn.user?.email}`);
        await clientAnon.auth.signOut();
    }
}

resetPassword();
