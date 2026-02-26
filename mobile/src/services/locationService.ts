/**
 * Location Service (Mobile)
 * Handles location-related functionality using Expo Location
 */

import * as Location from 'expo-location';

export interface Coordinates {
  lat: number;
  lng: number;
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
