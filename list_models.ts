
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

async function listModels() {
    console.log('--- BUSCANDO MATERIAL PEDAGÓGICO ---');
    const { data: models, error } = await supabase
        .from('modelos_recebimento')
        .select('*')
        .ilike('nome', '%Material Pedagógico%');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(JSON.stringify(models, null, 2));
    }
}

listModels();
