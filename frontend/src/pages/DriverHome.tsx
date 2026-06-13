import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useBookings } from '../hooks/useBookings';
import NearbyBookings from '../components/mapping/NearbyBookings';
import MapView from '../components/MapView';
import BookingCard from '../components/booking/BookingCard';
import BookingCardSkeleton from '../components/skeletons/BookingCardSkeleton';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import EmptyState from '../components/EmptyState';
import DriverEarnings from '../components/driver/DriverEarnings';
import RouteOptimizer from '../components/driver/RouteOptimizer';
import { useToast } from '../components/ToastContainer';
import LiveTracking from '../components/LiveTracking';
import LiveTrackingMap from '../components/map/LiveTrackingMap';
import AppShell from '../components/layout/AppShell';
import DriverHero from '../components/layout/DriverHero';
import { NavItem } from '../components/layout/BottomNav';
import './DriverHome.css';

const DRIVER_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'jobs', label: 'Jobs', icon: '📋' },
  { id: 'earnings', label: 'Earnings', icon: '💰' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

const DriverHome = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [online, setOnline] = useState(true);
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useBookings({
    filters: { role: 'driver' },
    refetchInterval: 10000,
  });

  const isInitialLoad = bookingsLoading && bookings === undefined;
  const pendingJob = bookings?.find((b: any) => b.status === 'pending' || b.status === 'assigned_driver');

  useEffect(() => {
    const handleOpenTracking = (event: CustomEvent) => {
      setTrackingBookingId(event.detail.bookingId);
    };
    window.addEventListener('openTracking' as any, handleOpenTracking as EventListener);
    return () => window.removeEventListener('openTracking' as any, handleOpenTracking as EventListener);
  }, []);

  const acceptMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.put(`/drivers/bookings/${bookingId}/accept`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast('Job accepted!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to accept', 'error');
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await api.put(`/drivers/bookings/${bookingId}/decline`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast('Job declined', 'info');
    },
  });

  if (!user?.id) {
    return <DashboardSkeleton />;
  }

  const renderJobRequest = (booking: any) => (
    <div className="sucar-job-card" key={booking.id}>
      <div className="sucar-job-card-header">
        <span>NEW JOB REQUEST</span>
        <span className="sucar-pill">Just now</span>
      </div>
      <div className="sucar-job-grid">
        <div>
          <div className="sucar-job-detail">
            <div className="sucar-job-detail-icon">👤</div>
            <div>
              <strong>{booking.clientId?.name || booking.clientName || 'Customer'}</strong>
              <p>{booking.pickupLocation || 'Pickup location'}</p>
            </div>
          </div>
          <div className="sucar-job-detail">
            <div className="sucar-job-detail-icon">🚗</div>
            <div>
              <strong>Car wash service</strong>
              <p>{booking.status?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>
        <div className="sucar-job-map-mini" aria-hidden />
      </div>
      <div className="sucar-job-footer">
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Est. Earnings</span>
          <div className="sucar-earnings-lg">${booking.totalPrice || booking.price || '28.50'}</div>
        </div>
        <div className="sucar-job-actions">
          <button
            type="button"
            className="sucar-btn-decline"
            onClick={() => declineMutation.mutate(booking.id)}
            disabled={declineMutation.isPending}
          >
            Decline
          </button>
          <button
            type="button"
            className="sucar-btn-accept"
            onClick={() => acceptMutation.mutate(booking.id)}
            disabled={acceptMutation.isPending}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <>
      {pendingJob && renderJobRequest(pendingJob)}
      <div className="sucar-section-head">
        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-primary-500)' }}>
          TODAY&apos;S EARNINGS
        </span>
        <button type="button" className="sucar-link" onClick={() => setActiveTab('earnings')}>
          View Summary ›
        </button>
      </div>
      <div className="sucar-stats-row">
        <div className="sucar-stat-card">
          <div className="sucar-stat-icon">💳</div>
          <div className="sucar-stat-value">$162.80</div>
          <div className="sucar-stat-label">Total</div>
        </div>
        <div className="sucar-stat-card">
          <div className="sucar-stat-icon" style={{ color: 'var(--color-success)' }}>
            💼
          </div>
          <div className="sucar-stat-value">6</div>
          <div className="sucar-stat-label">Jobs done</div>
        </div>
        <div className="sucar-stat-card">
          <div className="sucar-stat-icon" style={{ color: '#fbbf24' }}>
            ⏱
          </div>
          <div className="sucar-stat-value">5h 45m</div>
          <div className="sucar-stat-label">Online</div>
        </div>
      </div>
      <div className="sucar-card-panel sucar-incentive">
        <span>⭐</span>
        <p>Keep up the great work! You&apos;re in the top 20% of detailers today.</p>
        <span>›</span>
      </div>
    </>
  );

  const renderJobs = () => (
    <div className="sucar-card-panel">
      <h2 style={{ marginBottom: '1rem' }}>My Jobs</h2>
      {bookingsError && <div className="alert alert-error">{bookingsError.message}</div>}
      {isInitialLoad ? (
        <div className="bookings-list">
          {[1, 2, 3].map((i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      ) : bookings?.length ? (
        <div className="bookings-list">
          {bookings.map((b: any) => (
            <BookingCard
              key={b.id}
              booking={b}
              onStatusUpdate={() => queryClient.invalidateQueries({ queryKey: ['bookings'] })}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon="📋" title="No jobs" description="New requests appear when you're online" />
      )}
    </div>
  );

  const content =
    activeTab === 'dashboard'
      ? renderDashboard()
      : activeTab === 'jobs'
        ? renderJobs()
        : activeTab === 'earnings'
          ? (
              <div className="sucar-card-panel">
                <DriverEarnings />
              </div>
            )
          : activeTab === 'map'
            ? (
                <div className="driver-map-tab">
                  <div className="driver-map-tab-map">
                    <MapView
                      bookings={bookings?.filter((b: { pickupCoordinates?: unknown }) => b.pickupCoordinates) || []}
                      showNearbyServices
                      height="min(42vh, 320px)"
                    />
                  </div>
                  {bookings?.length ? (
                    <NearbyBookings bookings={bookings} />
                  ) : (
                    <EmptyState icon="🗺️" title="No jobs on map" description="Go online to receive nearby requests" />
                  )}
                </div>
              )
            : null;

  return (
    <>
      <AppShell
        skin="driver"
        hero={
          <DriverHero
            userName={user.name}
            profilePictureUrl={user.profilePictureUrl}
            online={online}
            onOnlineChange={setOnline}
          />
        }
        navItems={DRIVER_NAV}
        activeNav={activeTab}
        onNavChange={setActiveTab}
      >
        {content}
      </AppShell>

      {trackingBookingId && (
        <div className="live-tracking-overlay" onClick={() => setTrackingBookingId(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <LiveTracking bookingId={trackingBookingId} onClose={() => setTrackingBookingId(null)} />
          </div>
        </div>
      )}
    </>
  );
};

export default DriverHome;
