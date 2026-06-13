import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useBookings } from '../hooks/useBookings';
import EmptyState from '../components/EmptyState';
import MapView from '../components/MapView';
import EnhancedNearbyCarWashes from '../components/mapping/EnhancedNearbyCarWashes';
import LiveTracking from '../components/LiveTracking';
import LiveTrackingMap from '../components/map/LiveTrackingMap';
import BookingCard from '../components/booking/BookingCard';
import BookingCardSkeleton from '../components/skeletons/BookingCardSkeleton';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import AppShell from '../components/layout/AppShell';
import ClientHero from '../components/layout/ClientHero';
import { NavItem } from '../components/layout/BottomNav';
import './ClientHome.css';

const CLIENT_NAV: NavItem[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'bookings', label: 'Bookings', icon: '📅' },
  { id: 'vehicles', label: 'My Car', icon: '🚗' },
  { id: 'explore', label: 'Deals', icon: '🏷️' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

const SERVICES = [
  { id: 'standard', title: 'Standard Wash', desc: 'Exterior wash and clean', price: '$15', icon: '🫧' },
  { id: 'deluxe', title: 'Deluxe Wash', desc: 'Exterior + interior complete clean', price: '$30', icon: '✨' },
  { id: 'detail', title: 'Detailing', desc: 'Premium interior & exterior care', price: '$55', icon: '💎' },
];

const ClientHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);
  const [mapRoute, setMapRoute] = useState<any[]>([]);

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useBookings({
    filters: { role: 'client' },
    refetchInterval: activeTab === 'bookings' ? 30000 : false,
  });

  const { data: vehicles, isLoading: vehiclesLoading, error: vehiclesError } = useQuery({
    queryKey: ['vehicles', user?.id],
    queryFn: async () => {
      const response = await api.get('/vehicles');
      const vehiclesData = response.data?.data || response.data || [];
      return Array.isArray(vehiclesData) ? vehiclesData : [];
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  useEffect(() => {
    const handleOpenTracking = (event: CustomEvent) => {
      setTrackingBookingId(event.detail.bookingId);
    };
    window.addEventListener('openTracking' as any, handleOpenTracking as EventListener);
    return () => window.removeEventListener('openTracking' as any, handleOpenTracking as EventListener);
  }, []);

  const isInitialLoad = bookingsLoading && bookings === undefined;
  const hasActiveDriver = bookings?.some((b: any) =>
    ['assigned_driver', 'driver_arrived', 'in_service', 'ready_for_delivery', 'out_for_delivery'].includes(
      b.status
    )
  );

  if (!user?.id) {
    return <DashboardSkeleton />;
  }

  const renderHome = () => (
    <>
      <div className="sucar-section-head">
        <h2>Services</h2>
      </div>
      <div className="sucar-services-scroll">
        {SERVICES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="sucar-service-card"
            onClick={() => navigate('/client/book')}
          >
            <div className="sucar-service-card-top">
              <div className="sucar-service-icon">{s.icon}</div>
              <span aria-hidden>›</span>
            </div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
            <span className="sucar-service-price">{s.price} from</span>
          </button>
        ))}
      </div>

      <div className="sucar-section-head" style={{ marginTop: '1.5rem' }}>
        <h2>Quick Book</h2>
        <button type="button" className="sucar-link" onClick={() => setActiveTab('explore')}>
          View all
        </button>
      </div>

      <div className="sucar-map-block">
        <div className="sucar-map-inner">
          <MapView
            bookings={bookings?.filter((b: any) => b.pickupCoordinates) || []}
            showNearbyServices
            showCarWashes
            height="220px"
          />
        </div>
        <div className="sucar-location-card">
          <div className="sucar-location-thumb">🧼</div>
          <div className="sucar-location-info">
            <h3>SuCAR Downtown</h3>
            <div className="sucar-location-meta">
              <span>0.6 mi away</span>
              <span className="sucar-rating">★ 4.8 (128)</span>
            </div>
            <div className="sucar-location-meta">Open until 8:00 PM</div>
          </div>
          <button type="button" className="sucar-btn-book" onClick={() => navigate('/client/book')}>
            Book Now
          </button>
        </div>
      </div>

      {hasActiveDriver && (
        <button
          type="button"
          className="sucar-track-banner"
          onClick={() => setActiveTab('track')}
        >
          📍 Track your driver — tap to view live map
        </button>
      )}
    </>
  );

  const renderBookings = () => (
    <div className="sucar-card-panel">
      <div className="sucar-section-head">
        <h2>My Bookings</h2>
      </div>
      {bookingsError && (
        <div className="alert alert-error" role="alert">
          {bookingsError.message || 'Failed to load bookings'}
        </div>
      )}
      {isInitialLoad ? (
        <div className="bookings-list">
          {[1, 2, 3].map((i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      ) : bookings?.length ? (
        <div className="bookings-list">
          {bookings.map((booking: any) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onStatusUpdate={() => queryClient.invalidateQueries({ queryKey: ['bookings'] })}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📋"
          title="No bookings yet"
          description="Book your first wash from the home screen"
          action={{ label: 'Book now', onClick: () => navigate('/client/book') }}
        />
      )}
    </div>
  );

  const renderVehicles = () => (
    <div className="sucar-card-panel">
      <div className="sucar-section-head">
        <h2>My Vehicles</h2>
        <button type="button" className="sucar-link" onClick={() => navigate('/client/vehicles/add')}>
          + Add
        </button>
      </div>
      {vehiclesError && <div className="alert alert-error">{vehiclesError.message}</div>}
      {vehiclesLoading ? (
        <p className="text-muted">Loading vehicles…</p>
      ) : vehicles?.length ? (
        <div className="vehicles-list">
          {vehicles.map((v: any) => (
            <div key={v.id} className="sucar-vehicle-row">
              <span className="sucar-vehicle-icon">🚗</span>
              <div>
                <strong>
                  {v.make} {v.model}
                </strong>
                <p>
                  {v.plateNo} · {v.color}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🚗"
          title="No vehicles"
          description="Add a vehicle to book faster"
          action={{ label: 'Add vehicle', onClick: () => navigate('/client/vehicles/add') }}
        />
      )}
    </div>
  );

  const renderExplore = () => (
    <div className="sucar-map-block sucar-map-block--tall">
      <div className="map-layout-client">
        <div className="map-sidebar-client">
          <EnhancedNearbyCarWashes />
        </div>
        <div className="sucar-map-inner sucar-map-inner--tall">
          <MapView
            bookings={bookings?.filter((b: any) => b.pickupCoordinates) || []}
            showNearbyServices
            showCarWashes
            showRoute={mapRoute.length > 0}
            routeSegments={mapRoute}
            height="100%"
          />
        </div>
      </div>
    </div>
  );

  const renderTrack = () => {
    const activeBooking = bookings?.find((b: any) =>
      ['assigned_driver', 'driver_arrived', 'in_service', 'ready_for_delivery', 'out_for_delivery'].includes(
        b.status
      )
    );
    return activeBooking ? (
      <LiveTrackingMap bookingId={activeBooking.id} userRole="client" />
    ) : (
      <EmptyState
        icon="📍"
        title="No active trip"
        description="Track your driver when a booking is in progress"
        action={{ label: 'View bookings', onClick: () => setActiveTab('bookings') }}
      />
    );
  };

  const content =
    activeTab === 'home'
      ? renderHome()
      : activeTab === 'bookings'
        ? renderBookings()
        : activeTab === 'vehicles'
          ? renderVehicles()
          : activeTab === 'explore'
            ? renderExplore()
            : activeTab === 'track'
              ? renderTrack()
              : null;

  return (
    <>
      <AppShell
        skin="light"
        hero={
          activeTab === 'home' ? (
            <ClientHero
              userName={user.name}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
            />
          ) : undefined
        }
        navItems={CLIENT_NAV}
        activeNav={activeTab === 'track' ? 'bookings' : activeTab}
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

export default ClientHome;
