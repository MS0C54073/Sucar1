import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useBookings } from '../hooks/useBookings';
import MapView from '../components/MapView';
import NearbyBookings from '../components/mapping/NearbyBookings';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationCenter from '../components/notifications/NotificationCenter';
import BookingCard from '../components/booking/BookingCard';
import BookingCardSkeleton from '../components/skeletons/BookingCardSkeleton';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import EmptyState from '../components/EmptyState';
import DriverEarnings from '../components/driver/DriverEarnings';
import RouteOptimizer from '../components/driver/RouteOptimizer';
import { useToast } from '../components/ToastContainer';
import LiveTracking from '../components/LiveTracking';
import LiveTrackingMap from '../components/map/LiveTrackingMap';
import './DriverHome.css';
import ThemeToggle from '../components/ThemeToggle';

const DriverHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'earnings' | 'routes' | 'track-client'>('list');
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);

  // Use centralized bookings hook
  // Critical data: Load immediately
  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useBookings({
    filters: { role: 'driver', status: selectedStatus || undefined },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Only block on initial load
  const isInitialLoad = bookingsLoading && bookings === undefined;

  // Ensure user is loaded before rendering
  if (!user || !user.id) {
    return <DashboardSkeleton />;
  }

  // Listen for tracking events from BookingCard
  useEffect(() => {
    const handleOpenTracking = (event: any) => {
      setTrackingBookingId(event.detail.bookingId);
    };
    window.addEventListener('openTracking' as any, handleOpenTracking as EventListener);
    return () => window.removeEventListener('openTracking' as any, handleOpenTracking as EventListener);
  }, []);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await api.put(`/bookings/${bookingId}/status`, { status });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate all booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      showToast(`Status updated to ${variables.status.replace(/_/g, ' ')}`, 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update status', 'error');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.put(`/drivers/bookings/${bookingId}/accept`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      showToast('Booking accepted successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to accept booking', 'error');
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.put(`/drivers/bookings/${bookingId}/decline`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      showToast('Booking declined', 'info');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to decline booking', 'error');
    },
  });

  const handleStatusUpdate = (bookingId: string, currentStatus: string) => {
    const statusFlow: Record<string, string[]> = {
      'accepted': ['picked_up'],
      'picked_up': ['delivered_to_wash'],
      'delivered_to_wash': ['delivered_to_client'],
      'waiting_bay': ['delivered_to_client'],
      'washing_bay': ['delivered_to_client'],
      'drying_bay': ['delivered_to_client'],
      'wash_completed': ['delivered_to_client'],
    };

    const nextStatuses = statusFlow[currentStatus] || [];
    if (nextStatuses.length === 0) {
      alert('No further status updates available');
      return;
    }

    const nextStatus = nextStatuses[0];
    if (confirm(`Update status to ${nextStatus.replace('_', ' ')}?`)) {
      updateStatusMutation.mutate({ bookingId, status: nextStatus });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't block - show skeleton instead

  return (
    <div className="driver-home">
      <header className="driver-header">
        <div className="header-content">
          <h1>SuCAR - Driver Dashboard</h1>
          <p className="welcome-text">Welcome, {user?.name}</p>
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
            Logout
          </button>
        </div>
      </header>

      <div className="driver-filters">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="status-filter"
        >
          <option value="">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="picked_up">Picked Up</option>
          <option value="delivered_to_wash">Delivered to Wash</option>
          <option value="delivered_to_client">Delivered to Client</option>
        </select>
        <div className="view-toggle">
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            📋 List
          </button>
          <button
            className={viewMode === 'map' ? 'active' : ''}
            onClick={() => setViewMode('map')}
          >
            🗺️ Map
          </button>
          <button
            className={viewMode === 'routes' ? 'active' : ''}
            onClick={() => setViewMode('routes')}
          >
            🚗 Routes
          </button>
          <button
            className={viewMode === 'earnings' ? 'active' : ''}
            onClick={() => setViewMode('earnings')}
          >
            💰 Earnings
          </button>
          {bookings?.some((b: any) => ['assigned_driver', 'driver_arrived', 'in_service', 'ready_for_delivery', 'out_for_delivery'].includes(b.status)) && (
            <button
              className={viewMode === 'track-client' ? 'active' : ''}
              onClick={() => setViewMode('track-client')}
            >
              📍 Track Client
            </button>
          )}
        </div>
      </div>

      <main className="driver-content">
        {viewMode === 'earnings' && (
          <div className="driver-earnings-view">
            <h2>Earnings & Performance</h2>
            {/* Lazy load earnings - not critical for initial view */}
            <DriverEarnings />
          </div>
        )}

        {viewMode === 'routes' && (
          <div className="driver-routes-view">
            <h2>Route Optimization</h2>
            {bookings && bookings.length > 0 ? (
              <RouteOptimizer bookings={bookings} />
            ) : (
              <p>No active bookings for routing</p>
            )}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="driver-bookings-view">
            <h2>My Bookings</h2>
            {bookingsError && (
              <div style={{ padding: '16px', background: '#fee', color: '#c33', borderRadius: '8px', marginBottom: '16px' }}>
                <strong>Error loading bookings:</strong> {bookingsError.message || 'Failed to load bookings. Please check console for details.'}
                <br />
                <small>Check browser console (F12) for more details</small>
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
                title="No bookings found"
                description="You don't have any bookings yet. Available bookings will appear here when clients request pickup services."
              />
            )}
          </div>
        )}

        {viewMode === 'map' && (
          <div className="driver-map-view">
            <h2>Map View</h2>
            {bookings && bookings.length > 0 ? (
              <div style={{ height: '600px' }}>
                <NearbyBookings bookings={bookings} />
              </div>
            ) : (
              <EmptyState
                icon="🗺️"
                title="No bookings to display on map"
                description="Available bookings will appear here when clients request pickup services"
              />
            )}
          </div>
        )}

        {viewMode === 'track-client' && (
          <div className="driver-tracking-view">
            {bookings?.find((b: any) => ['assigned_driver', 'driver_arrived', 'in_service', 'ready_for_delivery', 'out_for_delivery'].includes(b.status)) ? (
              <LiveTrackingMap
                bookingId={bookings.find((b: any) => ['assigned_driver', 'driver_arrived', 'in_service', 'ready_for_delivery', 'out_for_delivery'].includes(b.status))?.id}
                userRole="driver"
              />
            ) : (
              <EmptyState
                icon="📍"
                title="No active booking"
                description="You don't have an active booking with a client assigned yet"
                action={{
                  label: "Accept a Booking",
                  onClick: () => setViewMode('list')
                }}
              />
            )}
          </div>
        )}
      </main>

      {trackingBookingId && (
        <div className="live-tracking-overlay" onClick={() => setTrackingBookingId(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <LiveTracking bookingId={trackingBookingId} onClose={() => setTrackingBookingId(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverHome;
