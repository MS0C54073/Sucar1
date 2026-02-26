
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

console.log('--- Supabase Connection Debugger ---');
console.log('SUPABASE_URL:', url);
console.log('SUPABASE_ANON_KEY:', key ? (key.substring(0, 5) + '...') : 'MISSING');

if (!url || !key) {
    console.error('Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    console.log('\n1. Testing basic connection (fetch users)...');
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

    console.log('\n2. Testing REST URL manually...');
    try {
        const restUrl = `${url}/rest/v1/`;
        console.log('Fetching:', restUrl);
        const res = await fetch(restUrl, {
            headers: {
                'apikey': key as string,
                'Authorization': `Bearer ${key as string}`
            } as Record<string, string>
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (e: any) {
        console.error('❌ Fetch failed:', e.message);
    }
}

test();
