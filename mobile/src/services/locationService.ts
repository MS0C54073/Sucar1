/**
 * Location Service (Mobile)
 * Handles location-related functionality using Expo Location
 */

import * as Location from 'expo-location';

export interface Coordinates {
  lat: number;
  lng: number;
}

/** Central Lusaka — default map focus for SuCAR */
export const LUSAKA_CENTER: Coordinates = { lat: -15.3875, lng: 28.3228 };

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

/** True when coords are plausibly in the Lusaka service area */
export function isNearLusaka(coords: Coordinates, radiusKm = 120): boolean {
  return distanceKm(coords, LUSAKA_CENTER) <= radiusKm;
}

/**
 * Ignore emulator / stale GPS that would zoom the map to another continent.
 * Returns coords only when they are near Lusaka or near known car washes.
 */
export function sanitizeUserLocationForMap(
  userCoords: Coordinates | undefined,
  markerCoords: Coordinates[] = []
): Coordinates | undefined {
  if (!userCoords) return undefined;
  if (isNearLusaka(userCoords)) return userCoords;

  if (markerCoords.length > 0) {
    const nearestKm = Math.min(...markerCoords.map((m) => distanceKm(userCoords, m)));
    if (nearestKm <= 60) return userCoords;
  }

  return undefined;
}

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface ResolvedUserLocation {
  coords?: Coordinates;
  permission: LocationPermissionStatus;
  loading: boolean;
  error: string | null;
  /** Raw GPS reading — may be outside Lusaka (e.g. emulator default) */
  rawCoords?: Coordinates;
}

/**
 * Request permission, read last-known position, then fetch a fresh fix.
 */
export async function resolveUserLocation(): Promise<ResolvedUserLocation> {
  try {
    const servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn) {
      return {
        permission: 'denied',
        loading: false,
        error: 'Turn on location services in your device settings.',
      };
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        permission: 'denied',
        loading: false,
        error: 'Location permission is required to show car washes near you.',
      };
    }

    let rawCoords: Coordinates | undefined;

    const last = await Location.getLastKnownPositionAsync();
    if (last) {
      rawCoords = {
        lat: last.coords.latitude,
        lng: last.coords.longitude,
      };
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: true,
    });

    rawCoords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };

    return {
      coords: rawCoords,
      rawCoords,
      permission: 'granted',
      loading: false,
      error: null,
    };
  } catch (error: any) {
    return {
      permission: 'undetermined',
      loading: false,
      error: error?.message || 'Could not detect your location.',
    };
  }
}

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
}

/**
 * Get current user position
 */
export async function getCurrentPosition(): Promise<Coordinates> {
  try {
    // Request permissions first
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error: any) {
    console.error('Error getting current position:', error);
    throw new Error(error.message || 'Failed to get current location');
  }
}

/**
 * Check if location services are enabled
 */
export async function isLocationEnabled(): Promise<boolean> {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    return enabled;
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
}
