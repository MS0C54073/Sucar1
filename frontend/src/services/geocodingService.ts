/**
 * Geocoding Service
 * Uses Mapbox Geocoding API for location search and autocomplete
 */

import { getMapboxToken } from '../config/mapbox';

export interface GeocodingResult {
  id: string;
  placeName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  context?: string[];
}

/**
 * Search for locations using Mapbox Geocoding API
 */
export async function searchLocations(
  query: string,
  proximity?: { lat: number; lng: number }
): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const token = getMapboxToken();
  const proximityParam = proximity 
    ? `&proximity=${proximity.lng},${proximity.lat}` 
    : '';

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
      `access_token=${token}&` +
      `limit=5&` +
      `types=address,poi,place${proximityParam}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return (data.features || []).map((feature: any) => ({
      id: feature.id,
      placeName: feature.place_name,
      coordinates: {
        lng: feature.center[0],
        lat: feature.center[1],
      },
      address: feature.place_name,
      context: feature.context?.map((ctx: any) => ctx.text) || [],
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  coordinates: { lat: number; lng: number }
): Promise<string | null> {
  const token = getMapboxToken();

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.lng},${coordinates.lat}.json?` +
      `access_token=${token}&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
