const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function listDistinctRoles() {
    const { data, error } = await supabase.from('profiles').select('role');
    if (error) {
        console.error('Error:', error);
    } else {
        const roles = [...new Set(data.map(r => r.role))];
        console.log('Distinct roles found:', roles);
    }
}

listDistinctRoles();
