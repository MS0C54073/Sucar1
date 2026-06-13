/**
 * useMapboxToken Hook
 * Uses env/fallback immediately, then optionally refreshes from Supabase edge function.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import {
  getMapboxToken,
  setMapboxRuntimeToken,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const envToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
      if (envToken) return;

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

        if (fnError) throw new Error(fnError.message || 'Failed to fetch token');

        if (data?.token) {
          localStorage.setItem(CACHE_KEY, data.token);
          localStorage.setItem(CACHE_EXPIRY_KEY, data.expires_at);
          setMapboxRuntimeToken(data.token);
          setToken(data.token);
          setError(null);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Token fetch failed';
        console.warn('Mapbox edge token:', message);
        if (!token) {
          const fallback = getMapboxToken();
          if (fallback) {
            setMapboxRuntimeToken(fallback);
            setToken(fallback);
          } else {
            setError(message);
          }
        }
      }
    };

    refresh();
    return () => {
      cancelled = true;
    };
  }, []);

  return { token, loading, error };
};

export default useMapboxToken;
