import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useBookings } from '../../hooks/useBookings';
import LoadingSpinner from '../LoadingSpinner';
import QueueManagement from './QueueManagement';
import BookingCard from '../booking/BookingCard';
import LiveTracking from '../LiveTracking';


const CarWashBookings = () => {
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'bookings' | 'queue'>('bookings');
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
    <div className="carwash-bookings">
      <div className="bookings-header">
        <h1>Bookings & Queue</h1>
        <div className="view-toggle">
          <button
            className={viewMode === 'bookings' ? 'active' : ''}
            onClick={() => setViewMode('bookings')}
          >
            📋 Bookings
          </button>
          <button
            className={viewMode === 'queue' ? 'active' : ''}
            onClick={() => setViewMode('queue')}
          >
            🚗 Queue
          </button>
        </div>
      </div>

      {viewMode === 'queue' ? (
        <QueueManagement />
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
