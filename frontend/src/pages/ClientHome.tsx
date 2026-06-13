import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useBookings } from '../hooks/useBookings';
import EmptyState from '../components/EmptyState';
import MapView from '../components/MapView';
import CarWashMapExplorer, {
  ExplorerCarWash,
  buildExplorerWashes,
} from '../components/map/CarWashMapExplorer';
import { getCurrentPosition } from '../services/locationService';
import { Coordinates } from '../services/mappingService';
import { filterLusakaCarWashes } from '../utils/lusakaCoordinates';
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
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'bookings', label: 'Bookings', icon: 'bookings' },
  { id: 'vehicles', label: 'My car', icon: 'car' },
  { id: 'explore', label: 'Nearby', icon: 'deals' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
];

const SERVICES = [
  { id: 'standard', title: 'Standard wash', desc: 'Exterior wash and dry', price: 'K150', tier: 'standard' as const },
  { id: 'deluxe', title: 'Deluxe wash', desc: 'Exterior and interior clean', price: 'K300', tier: 'deluxe' as const },
  { id: 'detail', title: 'Full detail', desc: 'Deep interior and exterior care', price: 'K550', tier: 'detail' as const },
];

const ClientHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);
  const [exploreSelectedWash, setExploreSelectedWash] = useState<ExplorerCarWash | null>(null);
  const [exploreUserLocation, setExploreUserLocation] = useState<Coordinates | null>(null);

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useBookings({
    filters: { role: 'client' },
    refetchInterval: activeTab === 'bookings' ? 30000 : false,
  });

  const {
    data: mapCarWashesRaw,
    isLoading: carWashesLoading,
    isError: carWashesError,
    refetch: refetchCarWashes,
  } = useQuery({
    queryKey: ['carwashes-map'],
    queryFn: async () => {
      const res = await api.get('/carwash/list?includeServices=true');
      return res.data.data || [];
    },
    staleTime: 60000,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  const mapCarWashes = useMemo(
    () => (mapCarWashesRaw ? filterLusakaCarWashes(mapCarWashesRaw as Record<string, unknown>[]) : []),
    [mapCarWashesRaw]
  );

  const explorerWashes = useMemo(
    () => buildExplorerWashes((mapCarWashesRaw as Record<string, unknown>[]) || []),
    [mapCarWashesRaw]
  );

  const handleHomeSearchSelect = (
    pick: import('../components/search/ClientHomeSearch').HomeSearchSelection
  ) => {
    if (pick.type === 'service') {
      setSearchQuery(pick.label);
      navigate('/client/book', { state: { servicePreset: pick.serviceId } });
      return;
    }
    setSearchQuery(pick.wash.name);
    navigate('/client/book', { state: { carWashId: pick.wash.id } });
  };

  const handleExploreWashSelect = (wash: ExplorerCarWash | null) => {
    setExploreSelectedWash(wash);
  };

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
    if (activeTab === 'explore') {
      getCurrentPosition()
        .then((pos) =>
          setExploreUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        )
        .catch(() => setExploreUserLocation(null));
    }
  }, [activeTab]);

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
              <div className={`sucar-service-icon sucar-service-icon--${s.tier}`} aria-hidden />
              <span className="sucar-service-chevron" aria-hidden>
                ›
              </span>
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
            carWashes={mapCarWashes}
            showNearbyServices
            showCarWashes
            height="220px"
          />
        </div>
        <div className="sucar-location-card">
          <div className="sucar-location-thumb" aria-hidden />
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
      <div className="sucar-tab-header">
        <h2>My Bookings</h2>
        <button
          type="button"
          className="sucar-link"
          onClick={() => navigate('/client/messages')}
        >
          💬 Messages
        </button>
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
          title="No bookings yet"
          description="Book your first wash from the home screen"
          action={{ label: 'Book now', onClick: () => navigate('/client/book') }}
        />
      )}
    </div>
  );

  const renderVehicles = () => (
    <div className="sucar-card-panel">
      <div className="sucar-section-head sucar-tab-header">
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
              <span className="sucar-vehicle-icon" aria-hidden />
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
          title="No vehicles"
          description="Add a vehicle to book faster"
          action={{ label: 'Add vehicle', onClick: () => navigate('/client/vehicles/add') }}
        />
      )}
    </div>
  );

  const renderExplore = () => (
    <div className="sucar-explore-layout sucar-explore-layout--map">
      <CarWashMapExplorer
        className="car-wash-map-explorer--in-shell car-wash-map-explorer--immersive"
        rawCarWashes={(mapCarWashesRaw as Record<string, unknown>[]) || []}
        isLoading={!mapCarWashesRaw}
        userLocation={exploreUserLocation}
        selectedWash={exploreSelectedWash}
        onSelectWash={handleExploreWashSelect}
        onBook={(washId, serviceId) =>
          navigate('/client/book', { state: { carWashId: washId, serviceId } })
        }
        searchPlaceholder="Search car washes near you…"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />
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
        contentVariant={activeTab === 'explore' ? 'map' : 'default'}
        subHeader={
          activeTab === 'explore' ? (
            <header className="sucar-subheader sucar-subheader--stacked">
              <div>
                <h1>Deals map</h1>
                <p className="sucar-subheader-hint">
                  Browse Lusaka car washes on the map, see routes, and book at a location.
                </p>
              </div>
            </header>
          ) : undefined
        }
        hero={
          activeTab === 'home' ? (
            <ClientHero
              userName={user.name}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              services={SERVICES.map((s) => ({
                id: s.id,
                title: s.title,
                desc: s.desc,
                price: s.price,
              }))}
              carWashes={explorerWashes}
              carWashesLoading={carWashesLoading}
              carWashesError={carWashesError}
              onRetryCarWashes={() => refetchCarWashes()}
              onSearchSelect={handleHomeSearchSelect}
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
