/**
 * LiveTrackingMap Component
 * Real-time bidirectional tracking: driver ↔ client
 * Displays live location markers and auto-updates every 5-10 seconds
 * Phase 1: Basic tracking with markers and bounds
 * Phase 2: Add directions, ETA, step list (will be enhanced)
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import useLiveLocation from '../hooks/useLiveLocation';
import MapView from './MapView';
import LoadingSpinner from './LoadingSpinner';
import './LiveTrackingMap.css';

interface LocationData {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  lastUpdated: string;
}

interface LiveTrackingMapProps {
  bookingId: string;
  userRole: 'client' | 'driver' | 'carwash';
  onClose?: () => void;
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  bookingId,
  userRole,
  onClose,
}) => {
  const { user } = useAuth();
  const [counterpartyLocation, setCounterpartyLocation] = useState<LocationData | null>(null);
  const [carWashLocations, setCarWashLocations] = useState<{ client?: LocationData; driver?: LocationData }>({});

  // Stream user's own location (5-second interval)
  const { location: userLocation } = useLiveLocation({
    enabled: true,
    intervalMs: 5000,
  });

  // Fetch counterparty location (poll every 5 seconds)
  const { data: fetchedCounterparty, isLoading: counterpartyLoading } = useQuery<LocationData | any>({
    queryKey: ['booking-counterparty', bookingId, userRole],
    queryFn: async () => {
      const response = await api.get(`/api/locations/booking-counterparty/${bookingId}`);
      return response.data.data;
    },
    enabled: !!bookingId && !!user,
    staleTime: 3000,
    refetchInterval: 5000,
    retry: false,
  });

  useEffect(() => {
    if (fetchedCounterparty) {
      if (userRole === 'carwash' && typeof fetchedCounterparty === 'object' && !fetchedCounterparty.userId) {
        // Car wash sees both client and driver
        setCarWashLocations(fetchedCounterparty);
      } else {
        // Client/Driver sees single counterparty
        setCounterpartyLocation(fetchedCounterparty);
      }
    }
  }, [fetchedCounterparty, userRole]);

  const getUserLabel = useCallback(() => {
    switch (userRole) {
      case 'client':
        return 'You (Client)';
      case 'driver':
        return 'You (Driver)';
      case 'carwash':
        return 'Car Wash';
      default:
        return 'You';
    }
  }, [userRole]);

  const getCounterpartyLabel = useCallback(() => {
    if (userRole === 'carwash') {
      return 'Participants';
    }
    return userRole === 'client' ? 'Driver' : 'Client';
  }, [userRole]);

  // Build map data
  const mapBookings =
    userLocation && (counterpartyLocation || (userRole === 'carwash' && carWashLocations.client))
      ? [
          {
            id: 'user-tracking',
            status: 'active',
            pickupLocation: getUserLabel(),
            pickupCoordinates: {
              lat: userLocation.latitude,
              lng: userLocation.longitude,
            },
          },
          ...(counterpartyLocation
            ? [
                {
                  id: 'counterparty-tracking',
                  status: 'active',
                  pickupLocation: getCounterpartyLabel(),
                  pickupCoordinates: {
                    lat: counterpartyLocation.latitude,
                    lng: counterpartyLocation.longitude,
                  },
                },
              ]
            : []),
          ...(userRole === 'carwash' && carWashLocations.driver
            ? [
                {
                  id: 'driver-tracking',
                  status: 'active',
                  pickupLocation: 'Driver',
                  pickupCoordinates: {
                    lat: carWashLocations.driver.latitude,
                    lng: carWashLocations.driver.longitude,
                  },
                },
              ]
            : []),
        ]
      : [];

  const centerCoordinates =
    userLocation && counterpartyLocation
      ? {
          lat: (userLocation.latitude + counterpartyLocation.latitude) / 2,
          lng: (userLocation.longitude + counterpartyLocation.longitude) / 2,
        }
      : userLocation
      ? {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        }
      : undefined;

  return (
    <div className="live-tracking-container">
      {/* Header */}
      <div className="tracking-header">
        <h3 className="tracking-title">📍 Live Tracking</h3>
        {onClose && (
          <button className="close-button" onClick={onClose} title="Close tracking">
            ✕
          </button>
        )}
      </div>

      {/* Status Info */}
      <div className="tracking-status">
        {counterpartyLoading ? (
          <div className="status-badge loading">
            <span className="pulse-dot"></span>
            Connecting...
          </div>
        ) : counterpartyLocation || (userRole === 'carwash' && carWashLocations.client) ? (
          <div className="status-badge active">
            <span className="pulse-dot active"></span>
            Live · Last updated now
          </div>
        ) : (
          <div className="status-badge error">
            <span>⚠️</span>
            Location unavailable
          </div>
        )}
      </div>

      {/* Map */}
      <div className="map-wrapper">
        {!userLocation || (counterpartyLoading && !counterpartyLocation) ? (
          <div className="loading-overlay">
            <LoadingSpinner size="md" />
            <p>Loading locations...</p>
          </div>
        ) : counterpartyLocation === null && userRole !== 'carwash' ? (
          <div className="error-overlay">
            <div className="error-message">
              <span>⚠️ Counterparty location not available</span>
              <p className="error-hint">They may not have location sharing enabled</p>
            </div>
          </div>
        ) : (
          <MapView
            bookings={mapBookings}
            center={centerCoordinates}
            zoom={15}
            height="100%"
            activeBookingId="user-tracking"
          />
        )}
      </div>

      {/* Location Details */}
      <div className="location-details">
        <div className="detail-row">
          <span className="detail-label">{getUserLabel()}:</span>
          <span className="detail-value">
            {userLocation
              ? `${userLocation.latitude.toFixed(4)}°, ${userLocation.longitude.toFixed(4)}°`
              : 'Loading...'}
          </span>
        </div>

        {counterpartyLocation && (
          <div className="detail-row">
            <span className="detail-label">{getCounterpartyLabel()}:</span>
            <span className="detail-value">
              {`${counterpartyLocation.latitude.toFixed(4)}°, ${counterpartyLocation.longitude.toFixed(4)}°`}
            </span>
          </div>
        )}

        {userRole === 'carwash' && carWashLocations.client && carWashLocations.driver && (
          <>
            <div className="detail-row">
              <span className="detail-label">Client:</span>
              <span className="detail-value">
                {`${carWashLocations.client.latitude.toFixed(4)}°, ${carWashLocations.client.longitude.toFixed(4)}°`}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Driver:</span>
              <span className="detail-value">
                {`${carWashLocations.driver.latitude.toFixed(4)}°, ${carWashLocations.driver.longitude.toFixed(4)}°`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="auto-refresh-hint">
        🔄 Updates every 5 seconds
      </div>
    </div>
  );
};

export default LiveTrackingMap;
