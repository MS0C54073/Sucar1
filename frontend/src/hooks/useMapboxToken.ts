/**
 * useMapboxToken Hook
 * Fetches and caches the Mapbox public token from the Supabase edge function
 * Handles token refresh with 1-hour expiration
 */

import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const CACHE_KEY = 'mapbox_token';
const CACHE_EXPIRY_KEY = 'mapbox_token_expiry';

interface MapboxTokenResponse {
  token: string;
  expires_at: string;
}

export const useMapboxToken = () => {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we have a valid cached token
        const cachedToken = localStorage.getItem(CACHE_KEY);
        const cachedExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);

        if (cachedToken && cachedExpiry) {
          const expiryTime = new Date(cachedExpiry).getTime();
          if (expiryTime > Date.now()) {
            // Token is still valid
            setToken(cachedToken);
            setLoading(false);
            return;
          }
        }

        // Fetch new token from Supabase edge function
        const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token', {
          method: 'POST',
          body: {},
        });

        if (fnError) {
          throw new Error(fnError.message || 'Failed to fetch token from edge function');
        }

        if (data?.token) {
          const newToken = data.token;
          const expiresAt = data.expires_at;

          // Cache the token and expiry time
          localStorage.setItem(CACHE_KEY, newToken);
          localStorage.setItem(CACHE_EXPIRY_KEY, expiresAt);

          setToken(newToken);
          setError(null);
        } else {
          throw new Error('No token in response');
        }
      } catch (err: any) {
        console.error('Error fetching Mapbox token:', err);

        // Fall back to environment variable token if available
        const fallbackToken = import.meta.env.VITE_MAPBOX_TOKEN;
        if (fallbackToken) {
          setToken(fallbackToken);
          setError(null);
        } else {
          setError(err.message || 'Failed to fetch Mapbox token');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, loading, error };
};

export default useMapboxToken;
