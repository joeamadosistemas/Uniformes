import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlkcmfurhbheasaqjhnj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ2NDExNiwiZXhwIjoyMDg4MDQwMTE2fQ.jKO27Ftqu4GoYNVpDUkdqR1yJ2oRaGzluaS6D9f98ro';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const adminEmail = 'em.eiderribeirodantas@edu.itaguai.rj.gov.br';
const adminPassword = 'Admin@2026';

async function main() {
    console.log('=== Criando Usuário Admin ===');

    // 1. Listar todos os usuários e verificar se admin já existe
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) { console.error('Erro ao listar usuários:', listError.message); return; }

    const existing = users.find(u => u.email === adminEmail);

    let userId;
    if (existing) {
        console.log(`✓ Usuário já existe no Auth. ID: ${existing.id}`);
        userId = existing.id;
        // Atualizar senha e confirmar email
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: adminPassword,
            email_confirm: true
        });
        if (updateError) console.error('  Erro ao atualizar usuário:', updateError.message);
        else console.log('  Senha atualizada e e-mail confirmado.');
    } else {
        const { data, error } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true
        });
        if (error) { console.error('Erro ao criar usuário:', error.message); return; }
        userId = data.user.id;
        console.log(`✓ Usuário criado com sucesso! ID: ${userId}`);
    }

    console.log(`\n✅ CREDENCIAIS DE ACESSO:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);

    // 2. Tentar inserir perfil (só funciona se a tabela já existir)
    console.log('\n--- Tentando inserir perfil na tabela profiles ---');
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, email: adminEmail, nome: 'Eider Ribeiro Dantas', role: 'Super Administrador' }, { onConflict: 'id' });

    if (profileError) {
        console.log('⚠️  Tabela profiles não existe ainda.');
        console.log('\n════════════════════════════════════════════════════════════');
        console.log('AÇÃO NECESSÁRIA: Execute o seguinte SQL no Supabase Dashboard');
        console.log(`URL: https://app.supabase.com/project/zlkcmfurhbheasaqjhnj/sql/new`);
        console.log('════════════════════════════════════════════════════════════\n');
        console.log(`-- ===== COLE E EXECUTE TODO ESTE BLOCO NO SQL EDITOR =====

-- 1. Tabela de Perfis de Usuários
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE,
    nome text,
    role text DEFAULT 'Operador',
    unidade_id uuid,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. Inserir perfil admin (substitua o UUID pelo ID do seu usuário)
INSERT INTO public.profiles (id, email, nome, role)
VALUES ('${userId}', '${adminEmail}', 'Eider Ribeiro Dantas', 'Super Administrador')
ON CONFLICT (id) DO UPDATE SET role = 'Super Administrador', nome = 'Eider Ribeiro Dantas';

-- 3. Tabela de Uniformes (se não existir)
CREATE TABLE IF NOT EXISTS public.uniformes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao text NOT NULL,
    segmento text,
    genero text,
    tamanho text,
    quantidade integer DEFAULT 0,
    preco_unitario numeric(10,2) DEFAULT 0,
    escola_id uuid,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.uniformes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uniformes_all" ON public.uniformes FOR ALL USING (true) WITH CHECK (true);

-- ===== FIM DO SQL =====`);
    } else {
        console.log('✅ Perfil admin inserido/atualizado na tabela profiles!');
        console.log('\n✅ Tudo pronto! Tente fazer login agora.');
    }
}

main();
