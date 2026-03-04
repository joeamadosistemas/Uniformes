const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_ROLE_KEY não definidos no .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const usersList = [
    { nome: 'Subsecretaria de Infraestrutura', email: 'infraestrutura@edu.itaguai.rj.gov.br', role: 'admin', password: 'smedu@2026' }
];

async function run() {
    console.log(`Iniciando a importação de ${usersList.length} usuários...`);

    for (const u of usersList) {
        console.log(`\nProcessando: ${u.nome} (${u.email})`);

        // 1. Determinar o perfil. Foi pedido papel 'admin'.
        const perfilTarget = 'Admin';
        let escolaId = null;

        // 3. Criar o Usuário no Auth do Supabase (ignora erro se já existir e pega o ID)
        let authUid = null;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { nome: u.nome }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log(`  - Auth: Usuário já registrado. Buscando ID...`);
                // Atualiza a senha para garantir que está a correta, também
                const { data: listData } = await supabase.auth.admin.listUsers();
                const existingUser = listData?.users.find(usr => usr.email.toLowerCase() === u.email.toLowerCase());

                if (existingUser) {
                    authUid = existingUser.id;
                    await supabase.auth.admin.updateUserById(authUid, { password: u.password });
                    console.log(`  - Auth: ID recuperado e senha atualizada.`);
                }
            } else {
                console.error(`  - ERRO na criação Auth:`, authError.message);
                continue;
            }
        } else {
            authUid = authData.user.id;
            console.log(`  - Auth: Criado com sucesso (${authUid})`);
        }

        if (!authUid) {
            console.error(`  - ERRO: Não foi possível obter ID da Auth para ${u.email}`);
            continue;
        }

        // 4. Upsert na tabela profiles para GARANTIR O PAPEL
        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', authUid).maybeSingle();

        if (existingProfile) {
            console.log(`  - Profile já existe. Atualizando permissões para Admin...`);
            const { error: updErr } = await supabase.from('profiles').update({
                perfil: perfilTarget,
                role: u.role,
                nome: u.nome
            }).eq('id', authUid);

            if (updErr) console.error(`  - ERRO ao atualizar Profile:`, updErr.message);
            else console.log(`  - Profile atualizado para Admin!`);
        } else {
            const { error: profileError } = await supabase.from('profiles').insert([{
                id: authUid,
                email: u.email,
                nome: u.nome,
                perfil: perfilTarget,
                role: u.role,
                escola_id: null
            }]);

            if (profileError) {
                console.error(`  - ERRO ao criar Profile:`, profileError.message);
            } else {
                console.log(`  - Profile: Criado com sucesso.`);
            }
        }
    }
    console.log('\n--- Finalizado ---');
}

run();
