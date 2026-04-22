/**
 * NearbyCarWashes Component
 * Displays nearby car washes on a map and in a list view
 * Allows users to search with custom radius, use current location, and book
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useLiveLocation from '../hooks/useLiveLocation';
import MapView from './MapView';
import LoadingSpinner from './LoadingSpinner';
import './NearbyCarWashes.css';

interface CarWash {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  isActive: boolean;
  createdAt: string;
}

interface NearbyCarWashesProps {
  onCarWashSelect?: (carWash: CarWash) => void;
  showBookButton?: boolean;
}

const NearbyCarWashes: React.FC<NearbyCarWashesProps> = ({
  onCarWashSelect,
  showBookButton = true,
}) => {
  const navigate = useNavigate();
  const [radiusKm, setRadiusKm] = useState(10);
  const [selectedCarWash, setSelectedCarWash] = useState<CarWash | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [listView, setListView] = useState(false);

  // Get user's current location
  const { location: gpsLocation, loading: gpsLoading, error: gpsError } = useLiveLocation({
    enabled: true,
    intervalMs: 10000, // Update every 10 seconds for initial setup
  });

  useEffect(() => {
    if (gpsLocation) {
      setUserLocation({
        lat: gpsLocation.latitude,
        lng: gpsLocation.longitude,
      });
    }
  }, [gpsLocation]);

  // Fetch nearby car washes
  const { data: nearbyCarWashes, isLoading, error, refetch } = useQuery<CarWash[]>({
    queryKey: ['nearby-carwashes', userLocation?.lat, userLocation?.lng, radiusKm],
    queryFn: async () => {
      if (!userLocation) {
        throw new Error('Location not available');
      }

      const response = await api.post('/api/nearby-carwashes', {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radiusKm,
      });

      return response.data.data || [];
    },
    enabled: !!userLocation,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseFloat(e.target.value);
    setRadiusKm(newRadius);
  };

  const handleUseMyLocation = useCallback(() => {
    if (gpsLocation) {
      setUserLocation({
        lat: gpsLocation.latitude,
        lng: gpsLocation.longitude,
      });
    }
  }, [gpsLocation]);

  const handleCarWashSelect = (carWash: CarWash) => {
    setSelectedCarWash(carWash);
    onCarWashSelect?.(carWash);
  };

  const handleBookCarWash = (carWash: CarWash) => {
    navigate('/booking', { state: { carWashId: carWash.id } });
  };

  // Map data for MapView component
  const carWashMarkers =
    nearbyCarWashes?.map((cw) => ({
      id: cw.id,
      status: cw.isActive ? 'active' : 'inactive',
      pickupLocation: cw.name,
      pickupCoordinates: { lat: cw.latitude, lng: cw.longitude },
    })) || [];

  return (
    <div className="nearby-carwashes-container">
      {/* Search Header */}
      <div className="search-header">
        <div className="search-controls">
          <div className="radius-control">
            <label htmlFor="radius-slider">Radius: {radiusKm} km</label>
            <input
              id="radius-slider"
              type="range"
              min="1"
              max="50"
              value={radiusKm}
              onChange={handleRadiusChange}
              className="radius-slider"
            />
          </div>

          <button
            className="location-button"
            onClick={handleUseMyLocation}
            disabled={gpsLoading}
            title="Use your current location"
          >
            {gpsLoading ? '📍 Getting location...' : '📍 Use My Location'}
          </button>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${!listView ? 'active' : ''}`}
              onClick={() => setListView(false)}
              title="Map view"
            >
              🗺️ Map
            </button>
            <button
              className={`toggle-btn ${listView ? 'active' : ''}`}
              onClick={() => setListView(true)}
              title="List view"
            >
              📋 List
            </button>
          </div>
        </div>

        {gpsError && (
          <div className="error-banner">
            <span>⚠️ {gpsError}</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      {!userLocation ? (
        <div className="loading-container">
          <LoadingSpinner size="lg" />
          <p>Getting your location...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-message">
            <span>❌ {error instanceof Error ? error.message : 'Failed to fetch nearby car washes'}</span>
            <button onClick={() => refetch()} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="loading-container">
          <LoadingSpinner size="lg" />
          <p>Finding nearby car washes...</p>
        </div>
      ) : !nearbyCarWashes || nearbyCarWashes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧼</div>
          <p>No car washes found within {radiusKm} km</p>
          <p className="empty-hint">Try increasing the radius</p>
        </div>
      ) : (
        <>
          {/* Map View */}
          {!listView && (
            <div className="map-section">
              <MapView
                bookings={carWashMarkers}
                center={userLocation}
                height="500px"
                activeBookingId={selectedCarWash?.id}
              />
            </div>
          )}

          {/* List View */}
          {listView && (
            <div className="list-section">
              <div className="carwash-list">
                {nearbyCarWashes.map((carWash) => (
                  <div
                    key={carWash.id}
                    className={`carwash-card ${selectedCarWash?.id === carWash.id ? 'selected' : ''}`}
                    onClick={() => handleCarWashSelect(carWash)}
                  >
                    <div className="carwash-header">
                      <h3 className="carwash-name">{carWash.name}</h3>
                      <span className="distance-badge">
                        {carWash.distanceKm.toFixed(1)} km away
                      </span>
                    </div>

                    <div className="carwash-status">
                      <span className={`status-dot ${carWash.isActive ? 'active' : 'inactive'}`}></span>
                      <span className="status-text">
                        {carWash.isActive ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    {showBookButton && (
                      <button
                        className="book-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookCarWash(carWash);
                        }}
                      >
                        Book Service →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="summary">
            Found <strong>{nearbyCarWashes.length}</strong> car wash{nearbyCarWashes.length !== 1 ? 'es' : ''} within{' '}
            <strong>{radiusKm} km</strong>
          </div>
        </>
      )}
    </div>
  );
};

export default NearbyCarWashes;
