
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env manually for node execution
const envContent = fs.readFileSync('.env', 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_SERVICE_ROLE_KEY']; // Use service role to bypass RLS for diag

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnostic() {
    console.log('--- DIAGNOSTIC START ---');
    console.log('URL:', supabaseUrl);

    // 1. Check if table exists and columns
    console.log('\n1. Checking table "recebimentos"...');
    // We try to select one item to see if it works
    const { data: sample, error: errSample } = await supabase.from('recebimentos').select('*').limit(1);

    if (errSample) {
        console.error('Error selecting from "recebimentos":', errSample);
    } else {
        console.log('Table "recebimentos" is accessible.');
        if (sample && sample.length > 0) {
            console.log('Columns found in record:', Object.keys(sample[0]));
        } else {
            console.log('Table is empty, but exists.');
        }
    }

    // 2. Check if "escolas" table matches what we expect
    console.log('\n2. Checking table "escolas"...');
    const { data: schools, error: errSchools } = await supabase.from('escolas').select('email').limit(5);
    if (errSchools) {
        console.error('Error selecting from "escolas":', errSchools);
    } else {
        console.log('Unique emails in "escolas":', schools.map(s => s.email));
    }
}

diagnostic();
