import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import { supabase } from '../config/supabase';

let schemaReadyCache: boolean | null = null;
let applyAttempted = false;

export function isMissingOperatorTableError(err: unknown): boolean {
  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : String(err);
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';

  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('Could not find the table') ||
    message.includes('washing_bays') ||
    message.includes('wash_sessions')
  );
}

export async function isOperatorSchemaReady(): Promise<boolean> {
  if (schemaReadyCache === true) return true;

  const { error } = await supabase.from('washing_bays').select('id').limit(0);
  if (!error) {
    schemaReadyCache = true;
    return true;
  }
  if (isMissingOperatorTableError(error)) {
    schemaReadyCache = false;
    return false;
  }
  throw error;
}

/** Apply operator migration when DATABASE_URL (or SUPABASE_DB_URL) is configured. */
export async function ensureOperatorSchema(): Promise<boolean> {
  if (await isOperatorSchemaReady()) return true;
  if (applyAttempted) return false;
  applyAttempted = true;

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.warn(
      '[operator-schema] washing_bays missing. Set DATABASE_URL in backend/.env and restart, or run SQL in Supabase dashboard.'
    );
    return false;
  }

  const sqlPath = join(__dirname, '../../migrations/operator-queue-bays-sessions.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('[operator-schema] Applying operator queue / bays migration…');
    await client.connect();
    await client.query(sql);
    schemaReadyCache = true;
    console.log('[operator-schema] Migration applied successfully.');
    return true;
  } catch (err) {
    console.error('[operator-schema] Migration failed:', err);
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}
