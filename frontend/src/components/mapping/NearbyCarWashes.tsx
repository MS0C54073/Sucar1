/**
 * NearbyCarWashes Component
 * 
 * Displays list of nearby car wash services for clients
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getCurrentPosition, Coordinates } from '../../services/locationService';
import { findNearby, parseCoordinates, formatDistance, calculateDistance } from '../../services/mappingService';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import Icon from '../icons/Icon';
import './NearbyCarWashes.css';

interface CarWash {
  id: string;
  name?: string;
  carWashName?: string;
  location?: string;
  locationCoordinates?: Coordinates | string;
  services?: any[];
  carWashPictureUrl?: string;
  profilePictureUrl?: string;
}

const NearbyCarWashes = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Fetch car washes
  const { data: carWashes, isLoading } = useQuery<CarWash[]>({
    queryKey: ['carwashes-nearby'],
    queryFn: async () => {
      try {
        const response = await api.get('/carwash/list');
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching car washes:', error);
        return [];
      }
    },
    staleTime: 60000, // Cache for 1 minute
  });

  // Get user location
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

  // Find nearby car washes
  const nearbyCarWashes = useMemo(() => {
    if (!carWashes || !userLocation) return [];
    
    const nearby = findNearby(carWashes, userLocation, 20); // 20km radius
    
    // Calculate and attach distance
    return nearby.map((carWash) => {
      const coords = parseCoordinates(carWash.locationCoordinates);
      const distance = coords ? calculateDistance(userLocation, coords) : Infinity;
      return { ...carWash, distance };
    }).sort((a, b) => a.distance - b.distance);
  }, [carWashes, userLocation]);

  if (isLoading) {
    return (
      <div className="nearby-carwashes">
        <h3>Nearby Car Washes</h3>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="nearby-carwashes">
        <h3>Nearby Car Washes</h3>
        <p className="error-message">{locationError}</p>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="nearby-carwashes">
        <h3>Nearby Car Washes</h3>
        <p>Getting your location...</p>
      </div>
    );
  }

  return (
    <div className="nearby-carwashes">
      <div className="nearby-header">
        <h3>Nearby Car Washes</h3>
        <span className="nearby-count">{nearbyCarWashes.length} found</span>
      </div>
      
      {nearbyCarWashes.length === 0 ? (
        <div className="nearby-empty">
          <p>No car washes found nearby</p>
        </div>
      ) : (
        <div className="nearby-list">
          {nearbyCarWashes.map((carWash) => (
            <div key={carWash.id} className="nearby-item">
              {carWash.carWashPictureUrl ? (
                <div className="nearby-item-picture">
                  <img 
                    src={carWash.carWashPictureUrl} 
                    alt={carWash.carWashName || carWash.name || 'Car Wash'} 
                    className="nearby-item-picture-img"
                  />
                </div>
              ) : (
                <div className="nearby-item-icon"><Icon name="droplets" size={20} /></div>
              )}
              <div className="nearby-item-content">
                <div className="nearby-item-name">
                  {carWash.carWashName || carWash.name || 'Car Wash'}
                </div>
                <div className="nearby-item-location">
                  {carWash.location || 'Location not specified'}
                </div>
                <div className="nearby-item-distance">
                  <Icon name="mapPin" size={13} /> {formatDistance(carWash.distance)} away
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyCarWashes;
