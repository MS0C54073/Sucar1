import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useToast } from '../components/ToastContainer';
import LiveTracking from '../components/LiveTracking';
import AppShell from '../components/layout/AppShell';
import DriverHero from '../components/layout/DriverHero';
import ThemeToggle from '../components/layout/ThemeToggle';
import { NavItem } from '../components/layout/BottomNav';
import JobSearchAutocomplete from '../components/search/JobSearchAutocomplete';
import { parseCoordinates, Coordinates } from '../services/mappingService';
import '../components/search/SearchAutocomplete.css';
import './DriverHome.css';

const DRIVER_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Today', icon: 'dashboard' },
  { id: 'jobs', label: 'Jobs', icon: 'jobs' },
  { id: 'earnings', label: 'Earnings', icon: 'earnings' },
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
];

const DriverHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [online, setOnline] = useState(true);
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);
  const [jobsSheetOpen, setJobsSheetOpen] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<Coordinates | undefined>();

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useBookings({
    filters: { role: 'driver' },
    refetchInterval: 10000,
  });

  const isInitialLoad = bookingsLoading && bookings === undefined;
  const pendingJob = bookings?.find((b: any) => b.status === 'pending' || b.status === 'assigned_driver');

  const filteredJobs = useMemo(() => {
    const q = jobSearchQuery.trim().toLowerCase();
    if (!q) return bookings || [];
    return (bookings || []).filter((b: any) => {
      const haystack = [
        b.pickupLocation,
        b.clientId?.name,
        b.clientName,
        b.carWashId?.carWashName,
        b.carWashId?.name,
        b.vehicleId?.plateNo,
        b.vehicleId?.make,
        b.vehicleId?.model,
        b.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return q.split(/\s+/).every((term: string) => haystack.includes(term));
    });
  }, [bookings, jobSearchQuery]);

  const filteredMapBookings = useMemo(
    () => filteredJobs.filter((b: { pickupCoordinates?: unknown }) => b.pickupCoordinates),
    [filteredJobs]
  );

  const handleJobSearchSelect = (booking: { id: string; clientId?: { name?: string }; clientName?: string; pickupCoordinates?: unknown }) => {
    const label = booking.clientId?.name || booking.clientName || 'Job';
    setJobSearchQuery(label);
    setSelectedJobId(booking.id);
    setJobsSheetOpen(true);
    const coords = parseCoordinates(booking.pickupCoordinates as Coordinates | string);
    if (coords) setMapCenter(coords);
  };

  useEffect(() => {
    const handleOpenTracking = (event: CustomEvent) => {
      setTrackingBookingId(event.detail.bookingId);
    };
    window.addEventListener('openTracking' as any, handleOpenTracking as EventListener);
    return () => window.removeEventListener('openTracking' as any, handleOpenTracking as EventListener);
  }, []);

  useEffect(() => {
    if (activeTab !== 'map') {
      setJobSearchQuery('');
      setSelectedJobId(null);
      setMapCenter(undefined);
    }
  }, [activeTab]);

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

  const handleNav = (id: string) => {
    if (id === 'profile') {
      navigate('/profile');
      return;
    }
    if (id !== 'map') setJobsSheetOpen(false);
    setActiveTab(id);
  };

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
            <div className="sucar-job-detail-icon" aria-hidden />
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
        <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Today&apos;s earnings</h2>
        <button type="button" className="sucar-link" onClick={() => setActiveTab('earnings')}>
          View summary
        </button>
      </div>
      <div className="sucar-stats-row">
        <div className="sucar-stat-card">
          <div className="sucar-stat-icon">💳</div>
          <div className="sucar-stat-value">$162.80</div>
          <div className="sucar-stat-label">Total</div>
        </div>
        <div className="sucar-stat-card">
          <div className="sucar-stat-icon">💼</div>
          <div className="sucar-stat-value">6</div>
          <div className="sucar-stat-label">Jobs done</div>
        </div>
        <div className="sucar-stat-card">
          <div className="sucar-stat-icon">⏱</div>
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
      <div className="sucar-tab-header">
        <h2>My Jobs</h2>
      </div>
      {bookingsError && <div className="alert alert-error">{(bookingsError as Error).message}</div>}
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
        <EmptyState title="No jobs right now" description="Stay online to receive new pickup requests." />
      )}
    </div>
  );

  const mapTabContent = (
    <div className="driver-map-tab driver-map-tab--fullscreen">
      <div className="driver-map-tab__search">
        <JobSearchAutocomplete
          bookings={bookings || []}
          value={jobSearchQuery}
          onChange={setJobSearchQuery}
          onSelect={handleJobSearchSelect}
          placeholder="Search jobs by client, location, plate…"
        />
      </div>
      <div className="driver-map-tab-map">
        <MapView
          bookings={filteredMapBookings}
          activeBookingId={selectedJobId || undefined}
          center={mapCenter}
          zoom={selectedJobId ? 14 : 12}
          showNearbyServices
          height="100%"
          autoFitMarkers={!selectedJobId && !mapCenter}
        />
      </div>
      {!bookings?.length && (
        <div className="driver-map-empty-overlay" role="status">
          <EmptyState icon="🗺️" title="No jobs on map" description="Go online to receive nearby requests" />
        </div>
      )}
      {bookings && bookings.length > 0 && filteredJobs.length === 0 && jobSearchQuery.trim() && (
        <div className="driver-map-empty-overlay" role="status">
          <EmptyState icon="🔍" title="No matching jobs" description="Try another name or location" />
        </div>
      )}
      {filteredJobs.length > 0 && (
        <div className="driver-map-jobs-sheet">
          <button
            type="button"
            className="driver-map-jobs-toggle"
            onClick={() => setJobsSheetOpen((o) => !o)}
            aria-expanded={jobsSheetOpen}
            aria-controls="driver-nearby-jobs"
          >
            {jobsSheetOpen ? 'Hide' : 'Show'} jobs ({filteredJobs.length})
          </button>
          <div
            id="driver-nearby-jobs"
            className={`driver-map-jobs-panel ${jobsSheetOpen ? 'open' : ''}`}
          >
            <NearbyBookings bookings={filteredJobs} />
          </div>
        </div>
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
                <div className="sucar-tab-header">
                  <h2>Earnings</h2>
                </div>
                <DriverEarnings />
              </div>
            )
          : activeTab === 'map'
            ? mapTabContent
            : null;

  return (
    <>
      <AppShell
        skin="driver"
        contentVariant={activeTab === 'map' ? 'map' : 'default'}
        subHeader={
          activeTab === 'map' ? (
            <header className="sucar-subheader">
              <h1>Jobs map</h1>
              <div className="sucar-subheader-actions">
                <ThemeToggle variant="segmented" />
              </div>
            </header>
          ) : undefined
        }
        hero={
          activeTab === 'dashboard' ? (
            <DriverHero
              userName={user.name}
              profilePictureUrl={user.profilePictureUrl}
              online={online}
              onOnlineChange={setOnline}
            />
          ) : undefined
        }
        navItems={DRIVER_NAV}
        activeNav={activeTab}
        onNavChange={handleNav}
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
