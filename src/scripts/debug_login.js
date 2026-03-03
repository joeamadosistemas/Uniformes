import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkcmfurhbheasaqjhnj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ2NDExNiwiZXhwIjoyMDg4MDQwMTE2fQ.jKO27Ftqu4GoYNVpDUkdqR1yJ2oRaGzluaS6D9f98ro';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseState() {
    console.log('--- Verificando estado do projeto Supabase ---');

    // Auth Users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    console.log(`Total de usuários no Auth: ${users?.length || 0}`);

    // Profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role');

    if (profileError) {
        console.error('Erro ao ler tabela profiles:', profileError.message);
    } else {
        console.log(`Total de perfis na tabela profiles: ${profiles.length}`);

        const targetEmail = 'em.eiderribeirodantas@edu.itaguai.rj.gov.br';
        const targetProfile = profiles.find(p => p.email === targetEmail);

        if (targetProfile) {
            console.log(`Perfil encontrado na tabela: Email=${targetProfile.email}, Role=${targetProfile.role}, ID=${targetProfile.id}`);
            const authUser = users.find(u => u.id === targetProfile.id);
            if (!authUser) {
                console.log('AVISO: Perfil existe mas NÃO tem usuário correspondente no Auth com esse ID.');
                const authUserByEmail = users.find(u => u.email === targetEmail);
                if (authUserByEmail) {
                    console.log(`Usuário encontrado no Auth por EMAIL Mas ID diferente! AuthID=${authUserByEmail.id}`);
                } else {
                    console.log('Usuário também não existe no Auth por Email.');
                }
            }
        } else {
            console.log(`Perfil ${targetEmail} NÃO encontrado na tabela profiles.`);
        }
    }

    // List all roles in profiles
    const roles = Array.from(new Set(profiles?.map(p => p.role)));
    console.log('Roles encontradas na tabela profiles:', roles);

    // Filter admins
    const admins = profiles?.filter(p => p.role === 'admin' || p.role === 'Super Administrador');
    console.log('Admins encontrados:', admins?.map(a => a.email));
}

checkDatabaseState();
