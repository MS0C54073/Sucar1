/**
 * useMapboxToken Hook
 * Uses env/fallback immediately, then optionally refreshes from Supabase edge function.
 */

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import api from '../services/api';
import {
  getMapboxToken,
  setMapboxRuntimeToken,
  validateMapboxToken,
  MAPBOX_TOKEN_CACHE_KEY,
  MAPBOX_TOKEN_EXPIRY_KEY,
} from '../config/mapbox';

const CACHE_KEY = MAPBOX_TOKEN_CACHE_KEY;
const CACHE_EXPIRY_KEY = MAPBOX_TOKEN_EXPIRY_KEY;

function readValidCache(): string | null {
  const cachedToken = localStorage.getItem(CACHE_KEY);
  const cachedExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
  if (!cachedToken || !cachedExpiry) return null;
  if (new Date(cachedExpiry).getTime() <= Date.now()) return null;
  return cachedToken;
}

export const useMapboxToken = () => {
  const [token, setToken] = useState(() => {
    const cached = readValidCache();
    if (cached) {
      setMapboxRuntimeToken(cached);
      return cached;
    }
    const immediate = getMapboxToken();
    if (immediate) setMapboxRuntimeToken(immediate);
    return immediate;
  });
  const [loading, setLoading] = useState(() => !readValidCache() && !getMapboxToken());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applyToken = (value: string, expiresAt?: string) => {
      if (cancelled || !validateMapboxToken(value)) return false;
      localStorage.setItem(CACHE_KEY, value);
      localStorage.setItem(
        CACHE_EXPIRY_KEY,
        expiresAt || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      );
      setMapboxRuntimeToken(value);
      setToken(value);
      setError(null);
      return true;
    };

    const refresh = async () => {
      // A build-time token (set via VITE_MAPBOX_TOKEN) is already resolved synchronously.
      const envToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
      if (envToken && validateMapboxToken(envToken)) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1) Preferred: fetch from our backend (token lives in backend/.env only).
      try {
        const res = await api.get('/config/mapbox-token');
        if (res.data?.token && applyToken(res.data.token, res.data.expires_at)) {
          setLoading(false);
          return;
        }
      } catch {
        // fall through to other sources
      }

      // 2) Optional: Supabase edge function (only if configured).
      if (isSupabaseConfigured && supabase) {
        try {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Token fetch timeout')), 4000)
          );
          const fetchToken = supabase.functions.invoke('get-mapbox-token', {
            method: 'POST',
            body: {},
          });
          const { data, error: fnError } = await Promise.race([fetchToken, timeout]);
          if (cancelled) return;
          if (!fnError && data?.token && applyToken(data.token, data.expires_at)) {
            setLoading(false);
            return;
          }
        } catch (err: unknown) {
          if (cancelled) return;
          console.warn('Mapbox edge token:', err instanceof Error ? err.message : err);
        }
      }

      if (cancelled) return;

      // 3) Last resort: whatever the synchronous resolver can find (cache/env).
      const fallback = getMapboxToken();
      if (fallback) {
        setMapboxRuntimeToken(fallback);
        setToken(fallback);
        setError(null);
      } else {
        setError('Mapbox token not configured');
      }
      setLoading(false);
    };

    refresh();
    return () => {
      cancelled = true;
    };
  }, []);

  return { token, loading, error };
};

export default useMapboxToken;
