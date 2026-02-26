import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useBookings } from '../hooks/useBookings';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import MapView from '../components/MapView';
import EnhancedNearbyCarWashes from '../components/mapping/EnhancedNearbyCarWashes';
import LiveTracking from '../components/LiveTracking';
import NotificationCenter from '../components/notifications/NotificationCenter';
import BookingCard from '../components/booking/BookingCard';
import BookingCardSkeleton from '../components/skeletons/BookingCardSkeleton';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import { useQueryClient } from '@tanstack/react-query';
import './ClientHome.css';
import ThemeToggle from '../components/ThemeToggle';

const ClientHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'bookings' | 'vehicles' | 'book' | 'map'>('bookings');
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);
  const [mapRoute, setMapRoute] = useState<any[]>([]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 ClientHome Debug:', {
      user: user ? { id: user.id, name: user.name, role: user.role } : null,
      hasToken: !!localStorage.getItem('token'),
    });
  }, [user]);

  // Use centralized bookings hook for consistent state
  // Critical data: Load immediately
  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useBookings({
    filters: { role: 'client' },
    refetchInterval: activeTab === 'bookings' ? 30000 : false, // Only refetch when on bookings tab, every 30 seconds
  });

  // Secondary data: Load in background, don't block UI
  const { data: vehicles, isLoading: vehiclesLoading, error: vehiclesError } = useQuery({
    queryKey: ['vehicles', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) {
          throw new Error('User not authenticated');
        }

        console.log('📡 Fetching vehicles for client');
        const response = await api.get('/vehicles');

        // Validate response
        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }

        if (response.data.success === false) {
          throw new Error(response.data.message || 'Failed to fetch vehicles');
        }

        const vehiclesData = response.data?.data || response.data || [];

        // Validate array
        if (!Array.isArray(vehiclesData)) {
          console.warn('⚠️ Vehicles data is not an array:', vehiclesData);
          return [];
        }

        console.log(`✅ Received ${vehiclesData.length} vehicles`);
        return vehiclesData;
      } catch (error: any) {
        // Log error but let React Query handle it
        console.error('❌ Error in vehicles queryFn:', error);
        // Re-throw so React Query can handle it properly
        throw error;
      }
    },
    staleTime: 30000,
    refetchOnMount: true,
    enabled: !!user && !!user.id,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Listen for tracking events from BookingCard
  useEffect(() => {
    const handleOpenTracking = (event: CustomEvent) => {
      setTrackingBookingId(event.detail.bookingId);
    };
    window.addEventListener('openTracking' as any, handleOpenTracking as EventListener);
    return () => {
      window.removeEventListener('openTracking' as any, handleOpenTracking as EventListener);
    };
  }, []);

  // Don't block on vehicles loading - show bookings immediately
  // Only show full loading on initial bookings load
  const isInitialLoad = bookingsLoading && bookings === undefined;

  // Ensure user is loaded before rendering
  if (!user || !user.id) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="client-home">
      <header className="client-header">
        <div>
          <h1>SuCAR</h1>
          <p className="welcome-text">
            Welcome back, {user?.name}
          </p>
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <NotificationCenter />
          <button className="avatar-btn" onClick={() => navigate('/profile')} title="My Profile" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            {user?.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{user?.name?.charAt(0)}</div>
            )}
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <nav className="client-nav">
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          My Bookings
        </button>
        <button
          className={activeTab === 'vehicles' ? 'active' : ''}
          onClick={() => setActiveTab('vehicles')}
        >
          My Vehicles
        </button>
        <button
          className={activeTab === 'book' ? 'active' : ''}
          onClick={() => setActiveTab('book')}
        >
          Book Service
        </button>
        <button
          className={activeTab === 'map' ? 'active' : ''}
          onClick={() => setActiveTab('map')}
        >
          Map View
        </button>
      </nav>

      <main className="client-content">
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h2>My Bookings</h2>
            {bookingsError && (
              <div style={{ padding: '16px', background: '#fee', color: '#c33', borderRadius: '8px', marginBottom: '16px' }}>
                <strong>Error loading bookings:</strong> {bookingsError.message || 'Failed to load bookings. Please check console for details.'}
              </div>
            )}
            {vehiclesError && activeTab === 'vehicles' && (
              <div style={{ padding: '16px', background: '#fee', color: '#c33', borderRadius: '8px', marginBottom: '16px' }}>
                <strong>Error loading vehicles:</strong> {vehiclesError.message || 'Failed to load vehicles. Please check console for details.'}
              </div>
            )}
            {isInitialLoad ? (
              <div className="bookings-list">
                {[1, 2, 3].map((i) => (
                  <BookingCardSkeleton key={i} />
                ))}
              </div>
            ) : !bookingsError && bookings && bookings.length > 0 ? (
              <div className="bookings-list">
                {bookings.map((booking: any) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onStatusUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ['bookings'] });
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📋"
                title="No bookings yet"
                description="Start by booking your first car wash service"
                action={{
                  label: "Book Service",
                  onClick: () => setActiveTab('book')
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="vehicles-section">
            <h2>My Vehicles</h2>
            <button
              className="add-vehicle-btn"
              onClick={() => navigate('/client/vehicles/add')}
            >
              Add Vehicle
            </button>
            {vehiclesLoading ? (
              <div className="vehicles-list">
                {[1, 2].map((i) => (
                  <div key={i} className="vehicle-card skeleton">
                    <div className="skeleton-line" style={{ width: '60%', height: '20px', marginBottom: '8px' }}></div>
                    <div className="skeleton-line" style={{ width: '40%', height: '16px' }}></div>
                  </div>
                ))}
              </div>
            ) : vehicles && vehicles.length > 0 ? (
              <div className="vehicles-list">
                {vehicles.map((vehicle: any) => (
                  <div key={vehicle.id} className="vehicle-card">
                    <h3>{vehicle.make} {vehicle.model}</h3>
                    <p>Plate: {vehicle.plateNo}</p>
                    <p>Color: {vehicle.color}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🚗"
                title="No vehicles yet"
                description="Add your first vehicle to start booking car wash services"
                action={{
                  label: "Add Vehicle",
                  onClick: () => navigate('/client/vehicles/add')
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'book' && (
          <div className="book-section">
            <h2>Book a Car Wash Service</h2>
            <button
              className="book-btn"
              onClick={() => navigate('/client/book')}
            >
              Create New Booking
            </button>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="map-section">
            <div className="map-section-header">
              <h2>Bookings & Nearby Services</h2>
              <p className="map-section-subtitle">
                View your bookings and discover nearby car wash services
              </p>
            </div>
            <div className="map-layout">
              <div className="map-sidebar">
                <EnhancedNearbyCarWashes
                  onRouteChange={(route) => {
                    setMapRoute(route || []);
                  }}
                />
              </div>
              <div className="map-section-content">
                <MapView
                  bookings={bookings?.filter((b: any) => b.pickupCoordinates) || []}
                  showNearbyServices={true}
                  showCarWashes={true}
                  showRoute={mapRoute.length > 0}
                  routeSegments={mapRoute}
                  onBookingClick={(booking) => {
                    if (['accepted', 'picked_up', 'at_wash'].includes(booking.status)) {
                      setTrackingBookingId(booking.id);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {trackingBookingId && (
        <div className="live-tracking-overlay">
          <LiveTracking
            bookingId={trackingBookingId}
            onClose={() => setTrackingBookingId(null)}
          />
        </div>
      )}
    </div>
  );
};

export default ClientHome;
