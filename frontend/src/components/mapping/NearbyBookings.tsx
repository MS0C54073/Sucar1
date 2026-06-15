/**
 * NearbyBookings Component
 * 
 * Displays nearby bookings for drivers with distance and estimated time
 */

import { useMemo, useState } from 'react';
import { getCurrentPosition, Coordinates } from '../../services/locationService';
import { findNearby, parseCoordinates, formatDistance, formatTime, calculateRouteSegment } from '../../services/mappingService';
import LoadingSpinner from '../LoadingSpinner';
import Icon from '../icons/Icon';
import './NearbyBookings.css';

interface Booking {
  id: string;
  status: string;
  pickupLocation: string;
  pickupCoordinates?: Coordinates | string;
  vehicleId?: {
    make?: string;
    model?: string;
    plateNo?: string;
  };
  clientId?: {
    name?: string;
  };
  carWashId?: {
    name?: string;
    carWashName?: string;
  };
}

interface NearbyBookingsProps {
  bookings: Booking[];
}

const NearbyBookings = ({ bookings }: NearbyBookingsProps) => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get driver location
  useMemo(() => {
    getCurrentPosition()
      .then((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      })
      .catch((error) => {
        console.warn('Location error:', error);
        setLocationError('Could not get your location');
      });
  }, []);

  // Find nearby bookings
  const nearbyBookings = useMemo(() => {
    if (!bookings || !userLocation) return [];
    
    const nearby = findNearby(bookings, userLocation, 15); // 15km radius
    
    // Calculate distance and estimated time for each booking
    return nearby
      .map((booking) => {
        const coords = parseCoordinates(booking.pickupCoordinates);
        if (!coords) return null;
        
        const segment = calculateRouteSegment(userLocation, coords);
        return {
          ...booking,
          distance: segment.distance,
          estimatedTime: segment.estimatedTime,
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)
      .sort((a, b) => a.distance - b.distance);
  }, [bookings, userLocation]);

  if (locationError) {
    return (
      <div className="nearby-bookings">
        <h3>Nearby Bookings</h3>
        <p className="error-message">{locationError}</p>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="nearby-bookings">
        <h3>Nearby Bookings</h3>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="nearby-bookings">
      <div className="nearby-header">
        <h3>Nearby Bookings</h3>
        <span className="nearby-count">{nearbyBookings.length} found</span>
      </div>
      
      {nearbyBookings.length === 0 ? (
        <div className="nearby-empty">
          <p>No bookings found nearby</p>
        </div>
      ) : (
        <div className="nearby-list">
          {nearbyBookings.map((booking) => (
            <div key={booking.id} className="nearby-item">
              <div className="nearby-item-icon"><Icon name="clipboard" size={20} /></div>
              <div className="nearby-item-content">
                <div className="nearby-item-name">
                  {booking.vehicleId 
                    ? `${booking.vehicleId.make} ${booking.vehicleId.model}`
                    : 'Vehicle'}
                </div>
                <div className="nearby-item-location">
                  {booking.pickupLocation}
                </div>
                <div className="nearby-item-meta">
                  <span className="nearby-item-distance">
                    <Icon name="mapPin" size={13} /> {formatDistance(booking.distance)}
                  </span>
                  <span className="nearby-item-time">
                    <Icon name="clock" size={13} /> {formatTime(booking.estimatedTime)}
                  </span>
                </div>
                {booking.clientId && (
                  <div className="nearby-item-client">
                    Client: {booking.clientId.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyBookings;
