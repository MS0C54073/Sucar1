import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '../services/locationService';

export function useUserLocation() {
  const [coords, setCoords] = useState<Coordinates | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch (e: any) {
        setError(e?.message || 'Location unavailable');
      }
    })();
  }, []);

  return { coords, error };
}

/** Haversine distance in km */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function parseWashCoords(wash: any): Coordinates | undefined {
  const raw = wash?.locationCoordinates || wash?.coordinates;
  if (!raw) return undefined;
  if (typeof raw === 'object' && raw.lat != null && raw.lng != null) {
    return { lat: Number(raw.lat), lng: Number(raw.lng) };
  }
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (p.lat != null && p.lng != null) return { lat: Number(p.lat), lng: Number(p.lng) };
    } catch {
      const [lat, lng] = raw.split(',').map(Number);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
    }
  }
  return undefined;
}
