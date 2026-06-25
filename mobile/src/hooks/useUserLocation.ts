import { useCallback, useEffect, useState } from 'react';
import {
  Coordinates,
  resolveUserLocation,
  sanitizeUserLocationForMap,
  LocationPermissionStatus,
  LUSAKA_CENTER,
  isNearLusaka,
  distanceKm,
} from '../services/locationService';

export { LUSAKA_CENTER, isNearLusaka, distanceKm };

export function useUserLocation(markerCoords: Coordinates[] = []) {
  const [coords, setCoords] = useState<Coordinates | undefined>();
  const [rawCoords, setRawCoords] = useState<Coordinates | undefined>();
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await resolveUserLocation();
    setPermission(result.permission);
    setRawCoords(result.rawCoords || result.coords);

    if (result.error) {
      setError(result.error);
    }

    const sanitized = sanitizeUserLocationForMap(result.coords, markerCoords);
    setCoords(sanitized);
    setLoading(false);
  }, [markerCoords]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Re-sanitize when marker list loads after GPS fix */
  useEffect(() => {
    if (!rawCoords || markerCoords.length === 0) return;
    const sanitized = sanitizeUserLocationForMap(rawCoords, markerCoords);
    setCoords((prev) => {
      if (prev?.lat === sanitized?.lat && prev?.lng === sanitized?.lng) return prev;
      return sanitized;
    });
  }, [rawCoords, markerCoords]);

  return {
    coords,
    rawCoords,
    loading,
    permission,
    error,
    refresh,
    /** True when GPS was read but rejected as implausible for Lusaka map */
    gpsRejected: Boolean(rawCoords && !coords),
  };
}

/** Haversine distance in km — kept for backward compatibility */
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
