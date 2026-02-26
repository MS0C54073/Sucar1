
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

console.log('--- Supabase Connection Debugger (JS) ---');
console.log('SUPABASE_URL:', url);
console.log('SUPABASE_ANON_KEY:', key ? (key.substring(0, 5) + '...') : 'MISSING');

if (!url || !key) {
    console.error('Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log('\n1. Testing basic connection (fetch users count)...');
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error fetching users:', error);
            console.error('Code:', error.code);
            console.error('Message:', error.message);
            console.error('Details:', error.details);
            console.error('Hint:', error.hint);
        } else {
            console.log('✅ Success! Users table reachable.');
        }
    } catch (err) {
        console.error('Exception during supabase query:', err);
    }

    console.log('\n2. Testing REST URL manually (using fetch)...');
    try {
        // Handle potential trailing slash
        const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const restUrl = `${baseUrl}/rest/v1/`;
        console.log('Fetching:', restUrl);

        // Node 18+ has native fetch
        const res = await fetch(restUrl, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (e) {
        console.error('❌ Fetch failed:', e.message);
    }
}

test();
