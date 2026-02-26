/**
 * AdminMapView Component
 * 
 * Comprehensive map view for admins showing all active operations:
 * - All bookings
 * - All car washes
 * - All drivers
 * - Real-time status
 */

import { useQuery } from '@tanstack/react-query';

import { useBookings } from '../../hooks/useBookings';
import MapView from '../MapView';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import './AdminMapView.css';

const AdminMapView = () => {


  // Fetch all bookings
  const { data: bookings, isLoading: bookingsLoading } = useBookings({
    filters: { role: 'admin' },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch all car washes
  const { data: carWashes, isLoading: carWashesLoading } = useQuery({
    queryKey: ['admin-carwashes'],
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

  // Fetch all drivers
  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: async () => {
      try {
        const response = await api.get('/drivers/available');
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching drivers:', error);
        return [];
      }
    },
    staleTime: 10000, // Cache for 10 seconds
  });

  const isLoading = bookingsLoading || carWashesLoading || driversLoading;

  // Get bookings with coordinates for map
  const mapBookings = bookings?.filter((booking: any) =>
    booking.pickupCoordinates
  ) || [];

  if (isLoading) {
    return (
      <div className="admin-map-view">
        <div className="admin-map-header">
          <h2>Operational Map View</h2>
        </div>
        <div className="admin-map-loading">
          <LoadingSpinner size="lg" />
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-map-view">
      <div className="admin-map-header">
        <h2>Operational Map View</h2>
        <div className="admin-map-stats">
          <div className="stat-item">
            <span className="stat-label">Bookings:</span>
            <span className="stat-value">{mapBookings.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Car Washes:</span>
            <span className="stat-value">{carWashes?.length || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Drivers:</span>
            <span className="stat-value">{drivers?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="admin-map-legend">
        <div className="legend-item">
          <span className="legend-icon">📋</span>
          <span className="legend-label">Bookings</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🧼</span>
          <span className="legend-label">Car Washes</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🚗</span>
          <span className="legend-label">Drivers</span>
        </div>
      </div>

      <div className="admin-map-container">
        <MapView
          bookings={mapBookings}
          showCarWashes={true}
          showDrivers={true}
          showNearbyServices={true}
          height="600px"
        />
      </div>
    </div>
  );
};

export default AdminMapView;
