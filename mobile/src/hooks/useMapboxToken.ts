import { useState, useEffect, useCallback } from 'react';
import {
  getMapboxAccessToken,
  setMapboxRuntimeToken,
  validateMapboxToken,
} from '../config/mapbox';
import { resolveMapboxToken } from '../services/mapboxTokenService';

export function useMapboxToken() {
  const [token, setToken] = useState(() => getMapboxAccessToken());
  const [loading, setLoading] = useState(() => !getMapboxAccessToken());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const value = await resolveMapboxToken();
      if (value && validateMapboxToken(value)) {
        setMapboxRuntimeToken(value);
        setToken(value);
        setError(null);
        return value;
      }
      setError('Mapbox token not configured. Start the backend or set EXPO_PUBLIC_MAPBOX_TOKEN.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { token, loading, error, refresh };
}
