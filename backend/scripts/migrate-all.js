/**
 * Apply every SQL migration against the configured database, in order.
 *
 * Usage (from backend folder):
 *   npm run migrate:all
 *
 * Requires DATABASE_URL (or SUPABASE_DB_URL) in the environment —
 * Supabase Dashboard → Project Settings → Database → Connection string (URI).
 *
 * Every file is idempotent (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS),
 * so this command is safe to run repeatedly (e.g. on every deploy/boot). Each file
 * runs independently; a non-fatal failure is reported but does not abort the run.
 */
require('dotenv').config();
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = join(__dirname, '../migrations');

// Base schema first, then additive migrations in a deterministic, dependency-aware order.
const ORDERED_FILES = [
  '../supabase-schema.sql', // base tables (relative to migrations dir)
  'add-user-approval-fields.sql',
  'add-admin-levels.sql',
  'add-admin-onboarding.sql',
  'add-audit-log.sql',
  'add-feature-flags.sql',
  'add-compliance-incidents.sql',
  'add-booking-type-now.sql',
  'add-car-wash-picture.sql',
  'add-car-wash-picture-now.sql',
  'add-location-tracking.sql',
  'add-location-rating-fields.sql',
  'add-payment-proof.sql',
  'remove-services-name-constraint.sql',
  'fix-services-constraint-SIMPLE.sql',
  'fix-services-constraint-comprehensive.sql',
  'operator-queue-bays-sessions.sql',
  'add-reviews.sql',
];

async function runFile(client, relativePath) {
  const fullPath = join(MIGRATIONS_DIR, relativePath);
  const label = relativePath.replace('../', '');

  if (!existsSync(fullPath)) {
    console.log(`\u23ED\uFE0F  Skipping ${label} (not found)`);
    return { label, status: 'skipped' };
  }

  const sql = readFileSync(fullPath, 'utf8');
  try {
    await client.query(sql);
    console.log(`\u2705 Applied ${label}`);
    return { label, status: 'ok' };
  } catch (err) {
    console.error(`\u26A0\uFE0F  ${label} failed: ${err.message}`);
    return { label, status: 'failed', error: err.message };
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.error('\u274C DATABASE_URL is not set.');
    console.error('   1. Supabase Dashboard → Project Settings → Database');
    console.error('   2. Copy the "Connection string" (URI) and set DATABASE_URL=postgresql://...');
    console.error('   3. Re-run: npm run migrate:all');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });

  const results = [];
  try {
    console.log('\uD83D\uDD04 Connecting to database…');
    await client.connect();
    console.log('\uD83D\uDCDD Applying migrations…\n');
    for (const file of ORDERED_FILES) {
      results.push(await runFile(client, file));
    }
  } catch (err) {
    console.error('\u274C Migration run aborted:', err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => undefined);
  }

  const failed = results.filter((r) => r.status === 'failed');
  const applied = results.filter((r) => r.status === 'ok').length;
  console.log(`\n\uD83D\uDCCA Done: ${applied} applied, ${failed.length} failed, ${results.length} total.`);

  if (failed.length > 0) {
    console.log('\u2139\uFE0F  Failed files may be safe to ignore (already-applied constraint fixes).');
    failed.forEach((f) => console.log(`   - ${f.label}: ${f.error}`));
  }
}

main();
