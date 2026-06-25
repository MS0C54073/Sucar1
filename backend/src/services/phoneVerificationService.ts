/**
 * Phone-verification schema bootstrap.
 *
 * Ensures the phone_verification_codes table exists (mirrors the reviews/
 * favorites pattern) so phone-OTP sign-in works for first-time users who do not
 * yet have a row in `users`.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import { supabase } from '../config/supabase';

let schemaReadyCache: boolean | null = null;
let applyAttempted = false;

function isMissingTableError(err: unknown): boolean {
  const message =
    err && typeof err === 'object' && 'message' in err ? String((err as any).message) : String(err);
  const code = err && typeof err === 'object' && 'code' in err ? String((err as any).code) : '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('Could not find the table') ||
    message.includes('phone_verification_codes')
  );
}

export async function isPhoneVerificationSchemaReady(): Promise<boolean> {
  if (schemaReadyCache === true) return true;
  const { error } = await supabase.from('phone_verification_codes').select('phone').limit(0);
  if (!error) {
    schemaReadyCache = true;
    return true;
  }
  if (isMissingTableError(error)) {
    schemaReadyCache = false;
    return false;
  }
  throw error;
}

export async function ensurePhoneVerificationSchema(): Promise<boolean> {
  if (await isPhoneVerificationSchemaReady()) return true;
  if (applyAttempted) return false;
  applyAttempted = true;

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.warn(
      '[phone-verification-schema] phone_verification_codes table missing. Set DATABASE_URL and restart, or run migrations/add-phone-verification.sql.'
    );
    return false;
  }

  const sql = readFileSync(join(__dirname, '../../migrations/add-phone-verification.sql'), 'utf8');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });
  try {
    console.log('[phone-verification-schema] Applying phone-verification migration…');
    await client.connect();
    await client.query(sql);
    schemaReadyCache = true;
    console.log('[phone-verification-schema] Migration applied successfully.');
    return true;
  } catch (err) {
    console.error('[phone-verification-schema] Migration failed:', err);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}
