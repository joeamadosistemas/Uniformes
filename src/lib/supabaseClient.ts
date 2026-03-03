import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing in .env file');
}

// Cliente padrão (Anon)
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Cliente Admin (Service Role) - Use com cautela apenas para ações de administrador
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl || '', supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
