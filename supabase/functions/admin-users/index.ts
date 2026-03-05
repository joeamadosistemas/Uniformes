import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Configuração de Preflight para CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Validar Variáveis de Ambiente do Servidor
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Faltam variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.");
        }

        // 2. Extrair o JWT do usuário que fez a requisição
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error("Cabeçalho Authorization ausente. É necessário estar logado.");
        }

        // 3. Criar um cliente Supabase autenticado como o usuário
        const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
        if (userError || !user) {
            throw new Error("Não autorizado: " + (userError?.message || 'Token inválido.'));
        }

        // 4. Verificar se este usuário possui privilégios de Admin na tabela de perfis
        const { data: profile, error: profileError } = await supabaseUserClient
            .from('profiles')
            .select('perfil')
            .eq('id', user.id)
            .single();

        if (profileError || !profile || (profile.perfil !== 'Admin' && profile.perfil !== 'administrador')) {
            throw new Error("Proibido: O usuário não possui permissão de Administrador.");
        }

        // 5. Como o usuário é um Admin válido, usamos nossa Service Role (oculta no backend) para operar
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const body = await req.json();
        const { action, userId, email, password, nome } = body;

        let resultData = null;

        if (action === 'create_user') {
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: { nome: nome }
            });
            if (error) throw error;
            resultData = data;
        }
        else if (action === 'update_password') {
            if (!userId) throw new Error("userId ausente para update_password");
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: password
            });
            if (error) throw error;
            resultData = data;
        }
        else if (action === 'delete_user') {
            if (!userId) throw new Error("userId ausente para delete_user");
            const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (error) throw error;
            resultData = data;
        }
        else {
            throw new Error("Ação (" + action + ") inválida.");
        }

        return new Response(
            JSON.stringify({ success: true, data: resultData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
