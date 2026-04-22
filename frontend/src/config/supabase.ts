/**
 * Supabase Client Configuration
 * Frontend instance for accessing Supabase services
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase environment variables not configured');
  console.warn('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓ set' : '✗ missing');
  console.warn('   VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓ set' : '✗ missing');
}

/**
 * Supabase client instance
 * Uses anonymous key for public operations (auth flows, edge functions)
 * JWT token from auth context automatically included in headers
 */
export const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || '',
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
    // Optimize for frontend (disable auto-reconnect spam)
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export default supabase;
