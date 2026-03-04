
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env manually
const envContent = fs.readFileSync('.env', 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('--- TABLE LIST ---');

    // We can query the information_schema via RPC or directly if allowed
    const { data: tables, error } = await supabase.rpc('get_tables'); // Custom RPC if it exists

    if (error) {
        console.log('RPC get_tables failed. Trying direct query...');
        const { data: tables2, error: error2 } = await supabase.from('pg_catalog.pg_tables').select('tablename').eq('schemaname', 'public');
        if (error2) {
            console.error('Error listing tables:', error2);

            // Fallback: Try common table names to see which ones work
            const commonTables = ['escolas', 'recebimentos', 'recebimento', 'profiles', 'Profile', 'modelos_recebimento'];
            for (const table of commonTables) {
                const { error: tErr } = await supabase.from(table).select('*').limit(1);
                console.log(`Table "${table}": ${tErr ? 'NOT FOUND' : 'EXISTS'}`);
            }
        } else {
            console.log('Tables found:', tables2.map(t => t.tablename));
        }
    } else {
        console.log('Tables found via RPC:', tables);
    }
}

listTables();
