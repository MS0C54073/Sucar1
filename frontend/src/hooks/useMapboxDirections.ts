/**
 * useMapboxDirections Hook
 * Fetches turn-by-turn directions from Mapbox Directions API
 */

import { useState, useCallback } from 'react';
import { getMapboxToken } from '../config/mapbox';

export interface DirectionStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface RouteData {
  distance: number;
  duration: number;
  steps: DirectionStep[];
  geometry: GeoJSON.Feature;
}

export const useMapboxDirections = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);

  const getDirections = useCallback(
    async (
      startLng: number,
      startLat: number,
      endLng: number,
      endLat: number,
      profile: 'driving' | 'walking' | 'cycling' = 'driving'
    ) => {
      try {
        setLoading(true);
        setError(null);

        const token = getMapboxToken();
        if (!token) {
          throw new Error('Mapbox token not available');
        }

        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${startLng},${startLat};${endLng},${endLat}?steps=true&geometries=geojson&access_token=${token}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch directions');
        }

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          
          // Extract steps with instructions
          const steps: DirectionStep[] = [];
          route.legs.forEach((leg: any) => {
            leg.steps.forEach((step: any) => {
              steps.push({
                instruction: step.maneuver?.instruction || 'Continue',
                distance: step.distance,
                duration: step.duration,
              });
            });
          });

          const routeData: RouteData = {
            distance: route.distance,
            duration: route.duration,
            steps,
            geometry: {
              type: 'Feature',
              geometry: route.geometry,
              properties: {},
            },
          };

          setRoute(routeData);
          return routeData;
        } else {
          throw new Error('No route found');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Directions API error:', errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { getDirections, loading, error, route };
};

export default useMapboxDirections;
