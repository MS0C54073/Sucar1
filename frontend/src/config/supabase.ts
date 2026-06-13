/**
 * Supabase client — only created when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
 * The app runs without Supabase (REST API + polling); realtime is optional.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured — realtime disabled; using API polling only.');
  console.warn('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env to enable.');
}

function createSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

/** Null when env vars are missing — always check before use. */
export const supabase = createSupabaseClient();

export default supabase;
