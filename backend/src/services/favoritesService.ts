/**
 * Favorites service — a client's saved car washes.
 *
 * Mirrors the reviews-schema pattern: applies migrations/add-favorites.sql when
 * DATABASE_URL is set, and degrades gracefully (callers treat "schema not ready"
 * as an empty list) so the Deals tab never 404s.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';
import { supabase } from '../config/supabase';

let schemaReadyCache: boolean | null = null;
let applyAttempted = false;

function isMissingFavoritesTableError(err: unknown): boolean {
  const message =
    err && typeof err === 'object' && 'message' in err ? String((err as any).message) : String(err);
  const code = err && typeof err === 'object' && 'code' in err ? String((err as any).code) : '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('Could not find the table') ||
    message.includes("'public.favorites'") ||
    message.includes('favorites')
  );
}

export async function isFavoritesSchemaReady(): Promise<boolean> {
  if (schemaReadyCache === true) return true;
  const { error } = await supabase.from('favorites').select('id').limit(0);
  if (!error) {
    schemaReadyCache = true;
    return true;
  }
  if (isMissingFavoritesTableError(error)) {
    schemaReadyCache = false;
    return false;
  }
  throw error;
}

/** Apply the favorites migration when DATABASE_URL (or SUPABASE_DB_URL) is set. */
export async function ensureFavoritesSchema(): Promise<boolean> {
  if (await isFavoritesSchemaReady()) return true;
  if (applyAttempted) return false;
  applyAttempted = true;

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.warn(
      '[favorites-schema] favorites table missing. Set DATABASE_URL and restart, or run migrations/add-favorites.sql.'
    );
    return false;
  }

  const sql = readFileSync(join(__dirname, '../../migrations/add-favorites.sql'), 'utf8');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });
  try {
    console.log('[favorites-schema] Applying favorites migration…');
    await client.connect();
    await client.query(sql);
    schemaReadyCache = true;
    console.log('[favorites-schema] Migration applied successfully.');
    return true;
  } catch (err) {
    console.error('[favorites-schema] Migration failed:', err);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

/** Car-wash ids a user has favorited. */
export async function listFavoriteWashIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('car_wash_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map((r: any) => r.car_wash_id);
}

export async function addFavorite(userId: string, carWashId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .upsert({ user_id: userId, car_wash_id: carWashId }, { onConflict: 'user_id,car_wash_id' });
  if (error) throw error;
}

export async function removeFavorite(userId: string, carWashId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('car_wash_id', carWashId);
  if (error) throw error;
}
