import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../hooks/useBookings';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from './ToastContainer';
import { watchPosition, clearWatch, Coordinates } from '../services/locationService';
import { parseCoordinates, calculateRouteSegment, formatDistance, formatTime } from '../services/mappingService';
import MapView from './MapView';
import LoadingSpinner from './LoadingSpinner';
import PaymentReviewModal from './payment/PaymentReviewModal';
import {
  getAllowedManualStatuses,
  canCancelBooking,
} from '../utils/bookingStatusOptions';
import './LiveTracking.css';

interface Booking {
  id: string;
  status: string;
  paymentStatus?: string;
  pickupLocation?: string;
  bookingType?: 'pickup_delivery' | 'drive_in';
  pickupCoordinates?: Coordinates;
  carWashId?: {
    name?: string;
    carWashName?: string;
    location?: string;
  };
  vehicleId?: {
    make?: string;
    model?: string;
    plateNo?: string;
  };
  driverId?: {
    name?: string;
    phone?: string;
  };
}

interface LiveTrackingProps {
  bookingId: string;
  onClose?: () => void;
}

const LiveTracking = ({ bookingId, onClose }: LiveTrackingProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [driverLocation, setDriverLocation] = useState<Coordinates | null>(null);
  const watchIdRef = useRef<number>(-1);
  const [isTracking, setIsTracking] = useState(false);
  const [manualStatus, setManualStatus] = useState<string>('');
  const [showPaymentReview, setShowPaymentReview] = useState(false);

  // Use centralized booking hook with automatic refetching
  const { data: booking, isLoading } = useBooking(bookingId, {
    refetchInterval: 5000, // Poll every 5 seconds for status updates
  });

  // Start tracking driver location if booking is active (only for drivers)
  useEffect(() => {
    if (!booking || !isTracking || user?.role !== 'driver') return;

    const shouldTrack = [
      'accepted',
      'picked_up',
      'delivered_to_wash',
      'wash_completed',
      'delivered_to_client',
    ].includes(booking.status);

    if (shouldTrack && watchIdRef.current === -1) {
      const watchId = watchPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Location tracking error:', error);
        }
      );
      watchIdRef.current = watchId;
    }

    return () => {
      if (watchIdRef.current >= 0) {
        clearWatch(watchIdRef.current);
        watchIdRef.current = -1;
      }
    };
  }, [booking, isTracking]);

  // Auto-start tracking for active bookings
  useEffect(() => {
    if (booking && ['accepted', 'picked_up', 'delivered_to_wash', 'wash_completed'].includes(booking.status)) {
      setIsTracking(true);
    }
  }, [booking]);

  // Mutations for role-based actions from the tracker
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, bookingId }: { status: string; bookingId: string }) => {
      const response = await api.put(`/bookings/${bookingId}/status`, { status });
      return response.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carwash-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      setManualStatus('');
      showToast?.(`Status updated to ${vars.status.replace(/_/g, ' ')}`, 'success');
    },
    onError: (err: any) => {
      showToast?.(err?.response?.data?.message || 'Failed to update status', 'error');
    }
  });

  const markReturnMutation = useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => {
      const response = await api.post(`/bookings/${bookingId}/return-in-progress`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      showToast?.('Vehicle picked from wash (return in progress)', 'success');
    },
    onError: (err: any) => showToast?.(err?.response?.data?.message || 'Failed to mark return in progress', 'error'),
  });

  const markOutForDeliveryMutation = useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => {
      const response = await api.post(`/bookings/${bookingId}/out-for-delivery`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      showToast?.('Out for delivery to client', 'success');
    },
    onError: (err: any) => showToast?.(err?.response?.data?.message || 'Failed to mark out for delivery', 'error'),
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => {
      const response = await api.post('/payments/confirm', { bookingId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carwash-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      showToast?.('Payment confirmed successfully', 'success');
    },
    onError: (err: any) => showToast?.(err?.response?.data?.message || 'Failed to confirm payment', 'error'),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/bookings/${bookingId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carwash-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      setManualStatus('');
      showToast?.('Booking cancelled', 'success');
      onClose?.();
    },
    onError: (err: any) => {
      showToast?.(err?.response?.data?.message || 'Failed to cancel booking', 'error');
    },
  });

  const handleCancelBooking = () => {
    if (!confirm('Cancel this booking? This cannot be undone.')) return;
    cancelBookingMutation.mutate();
  };

  const handleManualStatusUpdate = () => {
    if (!manualStatus) return;
    if (manualStatus === 'cancelled') {
      handleCancelBooking();
      return;
    }
    updateStatusMutation.mutate({ bookingId, status: manualStatus });
  };

  const getLocationDisplay = (b: Booking) => {
    if (b.bookingType === 'drive_in') {
      const wash = b.carWashId;
      const name =
        (typeof wash === 'object' && wash
          ? wash.carWashName || wash.name
          : null) || 'Car wash';
      const addr = typeof wash === 'object' && wash?.location ? wash.location : '';
      return { label: 'Car wash', value: addr ? `${name} — ${addr}` : name };
    }
    return {
      label: 'Pickup location',
      value: b.pickupLocation?.trim() || 'Pickup address not set',
    };
  };

  if (isLoading) {
    return (
      <div className="live-tracking-container">
        <div className="live-tracking-loading">
          <LoadingSpinner size="lg" />
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="live-tracking-container">
        <div className="live-tracking-error">
          <p>Booking not found</p>
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(booking.status);
  const locationDisplay = getLocationDisplay(booking);
  const timelineSteps = getStatusSteps(booking.status, booking.bookingType);
  const manualStatusOptions = getAllowedManualStatuses(user?.role, booking);
  const showCancelButton =
    canCancelBooking(user?.role, booking) &&
    !manualStatusOptions.some((o) => o.value === 'cancelled');

  return (
    <div className={`live-tracking-container ${user?.role === 'client' ? 'live-tracking-container--client' : ''}`}>
      <div className="live-tracking-header">
        <div className="live-tracking-title">
          <h2>Live Tracking</h2>
          <span className={`status-badge status-${booking.status}`}>
            {statusInfo.label}
          </span>
        </div>
        {onClose && (
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>

      <div className="live-tracking-status">
        <div className="status-timeline">
          {timelineSteps.map((step) => (
            <div
              key={step.status}
              className={`status-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''} ${!step.completed && !step.active ? 'upcoming' : ''}`}
            >
              <div className="status-step-icon" aria-hidden />
              <div className="status-step-label">{step.label}</div>
            </div>
          ))}
        </div>

        {user?.role === 'client' && (
          <p className="tracker-status-hint">{getClientStatusHint(booking)}</p>
        )}

        {['wash_completed', 'delivered_to_client', 'delivered'].includes(booking.status) &&
          booking.paymentStatus === 'pending' && (
            <div className="tracker-notice warning">
              {user?.role === 'client'
                ? 'Your wash is complete. Submit payment and receipt to finish.'
                : 'Payment pending — confirm after the client pays.'}
            </div>
          )}
      </div>

      {driverLocation && (
        <div className="location-info">
          <div className="info-card">
            <div className="info-item">
              <span className="info-label">Driver Location</span>
              <span className="info-value">
                📍 {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="live-tracking-info">
        <div className="info-card">
          <div className="info-item">
            <span className="info-label">{locationDisplay.label}</span>
            <span className="info-value">{locationDisplay.value}</span>
          </div>
          {booking.driverId && booking.bookingType === 'pickup_delivery' && (
            <div className="info-item">
              <span className="info-label">Driver</span>
              <span className="info-value">{booking.driverId.name}</span>
            </div>
          )}
          {booking.vehicleId && (
            <div className="info-item">
              <span className="info-label">Vehicle</span>
              <span className="info-value">
                {booking.vehicleId.make} {booking.vehicleId.model} ({booking.vehicleId.plateNo})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Role-based quick actions within tracker */}
      <div className="tracker-actions">
        {user?.role === 'client' && booking.status === 'picked_up_pending_confirmation' && (
          <button
            type="button"
            className="btn btn-primary tracker-primary-action"
            onClick={() => updateStatusMutation.mutate({ bookingId, status: 'picked_up' })}
            disabled={updateStatusMutation.isPending}
          >
            Confirm vehicle was picked up
          </button>
        )}

        {user?.role === 'client' &&
          ['delivered_to_client', 'delivered', 'wash_completed'].includes(booking.status) &&
          booking.paymentStatus === 'pending' && (
            <button
              type="button"
              className="btn btn-primary tracker-primary-action"
              onClick={() => navigate(`/client/payment/${bookingId}`)}
            >
              {booking.bookingType === 'drive_in'
                ? 'Pay now & upload receipt'
                : 'Confirm received & pay'}
            </button>
          )}

        {user?.role === 'client' &&
          booking.status !== 'picked_up_pending_confirmation' &&
          !['delivered_to_client', 'delivered', 'wash_completed', 'completed', 'cancelled'].includes(
            booking.status
          ) && (
            <p className="tracker-client-wait">
              Your booking is in progress. This screen updates automatically.
            </p>
          )}

        {user?.role === 'driver' && booking.status === 'accepted' && (
          <button className="btn btn-primary" onClick={() => updateStatusMutation.mutate({ bookingId, status: 'picked_up' })}>
            Mark as Picked Up
          </button>
        )}
        {user?.role === 'driver' && booking.status === 'picked_up' && (
          <button className="btn btn-primary" onClick={() => updateStatusMutation.mutate({ bookingId, status: 'delivered_to_wash' })}>
            Delivered to Car Wash
          </button>
        )}
        {user?.role === 'driver' && booking.status === 'wash_completed' && (
          <>
            <button className="btn" onClick={() => markReturnMutation.mutate({ bookingId })}>Pick from Wash</button>
            <button className="btn" onClick={() => markOutForDeliveryMutation.mutate({ bookingId })}>Out for Delivery</button>
            <button className="btn btn-primary" onClick={() => updateStatusMutation.mutate({ bookingId, status: 'delivered_to_client' })}>
              Delivered to Client
            </button>
          </>
        )}

        {/* Car wash actions */}
        {user?.role === 'carwash' && (booking.status === 'delivered_to_wash' || (booking.bookingType === 'drive_in' && booking.status === 'waiting_bay')) && (
          <button className="btn btn-primary" onClick={() => updateStatusMutation.mutate({ bookingId, status: 'at_wash' })}>
            Confirm Arrival
          </button>
        )}
        {user?.role === 'carwash' && (booking.status === 'delivered_to_wash' || booking.status === 'waiting_bay') && (
          <button className="btn btn-primary" onClick={() => updateStatusMutation.mutate({ bookingId, status: 'washing_bay' })}>
            Start Washing
          </button>
        )}
        {user?.role === 'carwash' && booking.status === 'washing_bay' && (
          <button className="btn btn-primary" onClick={() => updateStatusMutation.mutate({ bookingId, status: 'drying_bay' })}>
            Move to Drying
          </button>
        )}
        {user?.role === 'carwash' && booking.status === 'drying_bay' && (
          <button className="btn btn-primary" onClick={() => updateStatusMutation.mutate({ bookingId, status: 'wash_completed' })}>
            Complete Service
          </button>
        )}
        {(user?.role === 'driver' || user?.role === 'carwash') &&
          ['wash_completed', 'delivered_to_client', 'delivered'].includes(booking.status) &&
          booking.paymentStatus === 'pending' && (
            <button className="btn btn-primary" onClick={() => setShowPaymentReview(true)}>
              Review & Confirm Payment
            </button>
          )}

        {(manualStatusOptions.length > 0 || showCancelButton) && (
          <div className="tracker-manual-status">
            {manualStatusOptions.length > 0 && (
              <>
                <label className="tracker-manual-status__label" htmlFor="manual-status-select">
                  Update status manually
                </label>
                <p className="tracker-manual-status__hint">
                  Current: <strong>{statusInfo.label}</strong>
                </p>
                <div className="tracker-manual-status__row">
                  <select
                    id="manual-status-select"
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="tracker-manual-status__select"
                  >
                    <option value="">Choose status…</option>
                    {manualStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      !manualStatus ||
                      updateStatusMutation.isPending ||
                      cancelBookingMutation.isPending
                    }
                    onClick={handleManualStatusUpdate}
                  >
                    {updateStatusMutation.isPending || cancelBookingMutation.isPending
                      ? 'Updating…'
                      : 'Apply'}
                  </button>
                </div>
              </>
            )}

            {showCancelButton && (
              <button
                type="button"
                className="btn tracker-cancel-btn"
                disabled={cancelBookingMutation.isPending}
                onClick={handleCancelBooking}
              >
                {cancelBookingMutation.isPending ? 'Cancelling…' : 'Cancel booking'}
              </button>
            )}
          </div>
        )}
      </div>

      {showPaymentReview && bookingId && (
        <PaymentReviewModal
          bookingId={bookingId}
          onClose={() => setShowPaymentReview(false)}
          onConfirm={() => confirmPaymentMutation.mutate({ bookingId })}
          isConfirming={confirmPaymentMutation.isPending}
        />
      )}
    </div>
  );
};

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'warning' },
    accepted: { label: 'Accepted', color: 'info' },
    picked_up: { label: 'Picked Up', color: 'primary' },
    picked_up_pending_confirmation: { label: 'Pickup Pending Confirmation', color: 'warning' },
    delivered_to_wash: { label: 'Delivered to Wash', color: 'info' },
    at_wash: { label: 'At Car Wash', color: 'primary' },
    waiting_bay: { label: 'Waiting', color: 'info' },
    washing_bay: { label: 'Washing', color: 'info' },
    drying_bay: { label: 'Drying', color: 'info' },
    wash_completed: { label: 'Wash Complete', color: 'success' },
    delivered_to_client: { label: 'Delivered to Client', color: 'success' },
    completed: { label: 'Completed', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'error' },
  };

  return statusMap[status] || { label: status, color: 'secondary' };
};

function normalizeTimelineStatus(status: string): string {
  if (status === 'picked_up_pending_confirmation') return 'picked_up';
  if (status === 'delivered') return 'delivered_to_client';
  return status;
}

const getStatusSteps = (
  currentStatus: string,
  bookingType?: 'pickup_delivery' | 'drive_in'
) => {
  const normalized = normalizeTimelineStatus(currentStatus);

  const driveInSteps = [
    { status: 'pending', label: 'Booked' },
    { status: 'waiting_bay', label: 'Waiting' },
    { status: 'at_wash', label: 'At wash' },
    { status: 'washing_bay', label: 'Washing' },
    { status: 'drying_bay', label: 'Drying' },
    { status: 'wash_completed', label: 'Wash complete' },
    { status: 'completed', label: 'Done' },
  ];

  const pickupSteps = [
    { status: 'pending', label: 'Pending' },
    { status: 'accepted', label: 'Accepted' },
    { status: 'picked_up', label: 'Picked up' },
    { status: 'delivered_to_wash', label: 'At wash' },
    { status: 'washing_bay', label: 'Washing' },
    { status: 'drying_bay', label: 'Drying' },
    { status: 'wash_completed', label: 'Wash complete' },
    { status: 'delivered_to_client', label: 'Delivered' },
    { status: 'completed', label: 'Done' },
  ];

  const steps = bookingType === 'drive_in' ? driveInSteps : pickupSteps;
  const order = steps.map((s) => s.status);
  let currentIndex = order.indexOf(normalized);
  if (currentIndex < 0 && normalized === 'at_wash') {
    currentIndex = order.indexOf('waiting_bay');
  }

  return steps.map((step) => {
    const stepIndex = order.indexOf(step.status);
    return {
      ...step,
      completed: currentIndex >= 0 && stepIndex < currentIndex,
      active: stepIndex === currentIndex,
    };
  });
};

function getClientStatusHint(booking: Booking): string {
  const map: Record<string, string> = {
    pending: 'Your booking is waiting to be accepted.',
    accepted: 'A driver has accepted your booking.',
    picked_up_pending_confirmation: 'Please confirm your vehicle was picked up.',
    picked_up: 'Your vehicle is on the way to the car wash.',
    delivered_to_wash: 'Your vehicle has arrived at the car wash.',
    waiting_bay: 'Your vehicle is in the waiting bay.',
    at_wash: 'Your vehicle is at the car wash.',
    washing_bay: 'Your vehicle is being washed.',
    drying_bay: 'Your vehicle is in the drying bay.',
    wash_completed: 'Wash complete — you can pay when ready.',
    delivered_to_client: 'Your vehicle has been delivered back to you.',
    delivered: 'Your vehicle has been delivered.',
    completed: 'This booking is complete. Thank you!',
    cancelled: 'This booking was cancelled.',
  };
  return map[booking.status] || `Current status: ${booking.status.replace(/_/g, ' ')}`;
}

export default LiveTracking;
