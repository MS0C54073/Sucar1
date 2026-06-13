import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useBookings } from '../../hooks/useBookings';
import LoadingSpinner from '../LoadingSpinner';
import OperatorOperationsHub from './OperatorOperationsHub';
import BookingCard from '../booking/BookingCard';
import LiveTracking from '../LiveTracking';
import './CarWashBookings.css';

const CarWashBookings = () => {
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'bookings' | 'operations'>('operations');
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);

  // Use centralized bookings hook
  const { data: bookings, isLoading } = useBookings({
    filters: { role: 'carwash' },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Listen for `openTracking` events emitted by BookingCard
  useEffect(() => {
    const handleOpenTracking = (event: any) => {
      setTrackingBookingId(event.detail.bookingId);
    };
    window.addEventListener('openTracking' as any, handleOpenTracking as EventListener);
    return () => window.removeEventListener('openTracking' as any, handleOpenTracking as EventListener);
  }, []);


  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="carwash-bookings operator-bookings-page">
      <div className="bookings-header">
        <div>
          <h1>Operator dashboard</h1>
          <p className="bookings-header__sub">
            Live bays, queue, and payment verification — or manage individual bookings.
          </p>
        </div>
        <div className="view-toggle operator-view-toggle">
          <button
            type="button"
            className={viewMode === 'operations' ? 'active' : ''}
            onClick={() => setViewMode('operations')}
          >
            Live ops
          </button>
          <button
            type="button"
            className={viewMode === 'bookings' ? 'active' : ''}
            onClick={() => setViewMode('bookings')}
          >
            Bookings
          </button>
        </div>
      </div>

      {viewMode === 'operations' ? (
        <OperatorOperationsHub />
      ) : (
        <div className="bookings-view">
          {isLoading ? (
            <div className="loading-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="bookings-list">
              {bookings.map((booking: any) => (
                <BookingCard
                  key={booking.id || booking._id}
                  booking={booking}
                  onStatusUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: ['bookings'] });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No bookings found</p>
            </div>
          )}
        </div>
      )}

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

export default CarWashBookings;
