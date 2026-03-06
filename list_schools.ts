
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function listSchools() {
    console.log('--- ESCOLAS E SEGMENTOS ---');
    const { data: schools, error } = await supabase.from('escolas').select('nome, segmentos');
    if (error) {
        console.error('Error:', error);
    } else {
        schools?.forEach(s => {
            console.log(`${s.nome}: ${JSON.stringify(s.segmentos)}`);
        });
    }
}

listSchools();
