/**
 * Creates washing_bays, wash_sessions, and extends car_wash_queue / payments.
 *
 * Usage (from backend folder):
 *   node scripts/apply-operator-schema.js
 *
 * Requires DATABASE_URL in backend/.env — Supabase Dashboard → Settings → Database → Connection string (URI)
 */
require('dotenv').config();
const { readFileSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');

async function main() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in backend/.env');
    console.error('');
    console.error('Option A — run this script:');
    console.error('  1. Supabase Dashboard → Project Settings → Database');
    console.error('  2. Copy "Connection string" (URI, use postgres password)');
    console.error('  3. Add to backend/.env: DATABASE_URL=postgresql://...');
    console.error('  4. node scripts/apply-operator-schema.js');
    console.error('');
    console.error('Option B — SQL Editor:');
    console.error('  Paste backend/migrations/operator-queue-bays-sessions.sql and Run');
    process.exit(1);
  }

  const sql = readFileSync(
    join(__dirname, '../migrations/operator-queue-bays-sessions.sql'),
    'utf8'
  );

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('🔄 Connecting to database…');
    await client.connect();
    console.log('📝 Applying operator schema…');
    await client.query(sql);
    console.log('✅ Operator tables ready (washing_bays, wash_sessions, queue extensions).');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
