/**
 * Location Tracking Service (Frontend)
 * 
 * Handles location-related API calls and real-time tracking
 */

import api from './api';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationUpdate {
  coordinates: Coordinates;
  bookingId?: string;
  accuracy?: number;
  heading?: number;
  speed?: number;
  status?: 'idle' | 'en_route' | 'at_pickup' | 'at_wash' | 'at_dropoff';
}

export interface BookingLocationData {
  bookingId: string;
  pickupCoordinates: Coordinates;
  driverLocation?: Coordinates;
  carWashCoordinates?: Coordinates;
  status: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
}

export interface DriverLocationData {
  userId: string;
  name: string;
  coordinates: Coordinates;
  lastUpdate: Date;
  status: string;
  currentBookingId?: string;
}

/**
 * Update driver location
 */
export const updateDriverLocation = async (update: LocationUpdate): Promise<void> => {
  try {
    await api.post('/location/update', update);
  } catch (error) {
    console.error('Error updating driver location:', error);
    throw error;
  }
};

/**
 * Get driver location
 */
export const getDriverLocation = async (driverId: string): Promise<Coordinates | null> => {
  try {
    const response = await api.get(`/location/driver/${driverId}`);
    return response.data.data?.coordinates || null;
  } catch (error) {
    console.error('Error fetching driver location:', error);
    return null;
  }
};

/**
 * Get booking location data
 */
export const getBookingLocation = async (bookingId: string): Promise<BookingLocationData | null> => {
  try {
    const response = await api.get(`/location/booking/${bookingId}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Error fetching booking location:', error);
    return null;
  }
};

/**
 * Get all active driver locations (admin only)
 */
export const getActiveDriverLocations = async (): Promise<DriverLocationData[]> => {
  try {
    const response = await api.get('/location/drivers/active');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching active drivers:', error);
    return [];
  }
};

/**
 * Get location history for a booking
 */
export const getBookingLocationHistory = async (
  bookingId: string,
  limit: number = 50
): Promise<Array<{ coordinates: Coordinates; timestamp: Date; status: string }>> => {
  try {
    const response = await api.get(`/location/booking/${bookingId}/history`, {
      params: { limit },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching location history:', error);
    return [];
  }
};

/**
 * Start location tracking for a driver
 * Updates location at controlled intervals
 */
export const startLocationTracking = (
  onUpdate: (coordinates: Coordinates) => void,
  bookingId?: string,
  status: LocationUpdate['status'] = 'idle'
): (() => void) => {
  let watchId: number = -1;


  const updateLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const coordinates: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Call callback
        onUpdate(coordinates);

        // Update backend (throttled by backend)
        try {
          await updateDriverLocation({
            coordinates,
            bookingId,
            accuracy: position.coords.accuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // Convert m/s to km/h
            status,
          });
        } catch (error) {
          console.error('Error updating location on backend:', error);
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Accept cached positions up to 5 seconds old
      }
    );
  };

  // Start tracking
  updateLocation();


  // Return stop function
  return () => {
    if (watchId >= 0 && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);

    }
  };
};
