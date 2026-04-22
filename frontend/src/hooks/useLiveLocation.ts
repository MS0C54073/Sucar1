/**
 * useLiveLocation Hook
 * Streams GPS position to the backend every 5-10 seconds
 * Handles geolocation permission and error states
 */

import { useEffect, useState, useRef } from 'react';
import api from '../services/api';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface UseLiveLocationOptions {
  enabled?: boolean;
  intervalMs?: number; // Default 5000ms (5 seconds)
  onLocationUpdate?: (location: LocationData) => void;
  onError?: (error: string) => void;
}

export const useLiveLocation = (options: UseLiveLocationOptions = {}) => {
  const {
    enabled = true,
    intervalMs = 5000,
    onLocationUpdate,
    onError,
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Request initial location and start tracking
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Function to get and upload location
    const getAndUploadLocation = async () => {
      return new Promise<void>((resolve) => {
        if (!navigator.geolocation) {
          const err = 'Geolocation is not supported by your browser';
          setError(err);
          onError?.(err);
          resolve();
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude, accuracy } = position.coords;
              const locationData: LocationData = {
                latitude,
                longitude,
                accuracy,
              };

              // Update local state
              setLocation(locationData);
              setError(null);
              setLoading(false);
              onLocationUpdate?.(locationData);

              // Upload to backend
              try {
                await api.post('/api/locations/update-location', {
                  latitude,
                  longitude,
                  accuracyMeters: accuracy,
                });
              } catch (uploadErr: any) {
                // Log error but don't fail - local tracking should continue
                console.warn('Failed to upload location to backend:', uploadErr.message);
              }

              resolve();
            } catch (err: any) {
              console.error('Error processing location:', err);
              resolve();
            }
          },
          (err) => {
            let errorMsg = 'Unable to retrieve your location';
            
            switch (err.code) {
              case err.PERMISSION_DENIED:
                errorMsg = 'Location permission denied. Please enable location services.';
                break;
              case err.POSITION_UNAVAILABLE:
                errorMsg = 'Location information is unavailable.';
                break;
              case err.TIMEOUT:
                errorMsg = 'Location request timed out.';
                break;
            }

            console.error('Geolocation error:', errorMsg, err);
            setError(errorMsg);
            onError?.(errorMsg);
            setLoading(false);
            resolve();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    };

    // Get initial location immediately
    (async () => {
      await getAndUploadLocation();
    })();

    // Set up interval for continuous tracking
    intervalRef.current = setInterval(() => {
      getAndUploadLocation();
    }, intervalMs);

    // Cleanup on unmount or disable
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, intervalMs, onLocationUpdate, onError]);

  return {
    location,
    error,
    loading,
    isActive: enabled && !error,
  };
};

export default useLiveLocation;
