import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data.map(u => ({ id: u.id, nome: u.nome, role: u.role, email: u.email_escola })));
    }
}

listUsers();
