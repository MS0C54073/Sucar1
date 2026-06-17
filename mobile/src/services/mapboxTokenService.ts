/**
 * Shared Mapbox token resolver for maps + geocoding (usable outside React hooks).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/api';
import {
  getMapboxAccessToken,
  setMapboxRuntimeToken,
  validateMapboxToken,
  MAPBOX_TOKEN_CACHE_KEY,
  MAPBOX_TOKEN_EXPIRY_KEY,
} from '../config/mapbox';

let inflight: Promise<string> | null = null;

async function readValidCache(): Promise<string | null> {
  try {
    const cached = await AsyncStorage.getItem(MAPBOX_TOKEN_CACHE_KEY);
    const expiry = await AsyncStorage.getItem(MAPBOX_TOKEN_EXPIRY_KEY);
    if (!cached || !expiry) return null;
    if (new Date(expiry).getTime() <= Date.now()) return null;
    return validateMapboxToken(cached) ? cached : null;
  } catch {
    return null;
  }
}

async function writeCache(token: string, expiresAt?: string) {
  await AsyncStorage.setItem(MAPBOX_TOKEN_CACHE_KEY, token);
  await AsyncStorage.setItem(
    MAPBOX_TOKEN_EXPIRY_KEY,
    expiresAt || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  );
}

/** Fetch or return the Mapbox public token (cached, env, or backend API). */
export async function resolveMapboxToken(): Promise<string> {
  const existing = getMapboxAccessToken();
  if (existing) return existing;

  if (inflight) return inflight;

  inflight = (async () => {
    const cached = await readValidCache();
    if (cached) {
      setMapboxRuntimeToken(cached);
      return cached;
    }

    try {
      const res = await apiClient.get('/config/mapbox-token');
      const value = res.data?.token as string | undefined;
      if (value && validateMapboxToken(value)) {
        await writeCache(value, res.data?.expires_at);
        setMapboxRuntimeToken(value);
        return value;
      }
    } catch (err) {
      if (__DEV__) {
        console.warn(
          'resolveMapboxToken: backend fetch failed. Start the backend or set EXPO_PUBLIC_MAPBOX_TOKEN.',
          err
        );
      }
    }

    return getMapboxAccessToken();
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
