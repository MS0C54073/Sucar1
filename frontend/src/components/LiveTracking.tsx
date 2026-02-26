import { useEffect, useState, useRef } from 'react';
import { useBooking } from '../hooks/useBookings';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from './ToastContainer';
import { watchPosition, clearWatch, Coordinates } from '../services/locationService';
import { parseCoordinates, calculateRouteSegment, formatDistance, formatTime } from '../services/mappingService';
import MapView from './MapView';
import LoadingSpinner from './LoadingSpinner';
import './LiveTracking.css';

interface Booking {
  id: string;
  status: string;
  pickupLocation: string;
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
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [driverLocation, setDriverLocation] = useState<Coordinates | null>(null);
  const watchIdRef = useRef<number>(-1);
  const [isTracking, setIsTracking] = useState(false);
  const [manualStatus, setManualStatus] = useState<string>('');

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

  // Role-aware manual status options (universal control)
  const getManualStatusOptions = () => {
    const base: string[] = [];
    if (!booking) return base;
    const all = [
      'accepted',
      'picked_up',
      'delivered_to_wash',
      'at_wash',
      'waiting_bay',
      'washing_bay',
      'drying_bay',
      'wash_completed',
      'delivered_to_client',
      'completed',
      'cancelled',
    ];
    if (user?.role === 'admin' || user?.role === 'subadmin') return all;
    if (user?.role === 'driver') return ['picked_up','delivered_to_wash','delivered_to_client'];
    if (user?.role === 'carwash') return ['at_wash','waiting_bay','washing_bay','drying_bay','wash_completed'];
    if (user?.role === 'client') return ['picked_up','completed','cancelled'];
    return base;
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

  return (
    <div className="live-tracking-container">
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
          {getStatusSteps(booking.status).map((step, index) => (
            <div
              key={step.status}
              className={`status-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
            >
              <div className="status-step-icon">{step.icon}</div>
              <div className="status-step-label">{step.label}</div>
            </div>
          ))}
        </div>

        {['wash_completed','delivered_to_client','delivered'].includes(booking.status) && booking.paymentStatus === 'pending' && (
          <div className="tracker-notice warning" style={{ marginTop: 10 }}>
            💳 Payment pending — driver or car wash should confirm after the client pays.
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
            <span className="info-label">Pickup Location</span>
            <span className="info-value">{booking.pickupLocation}</span>
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
        {/* Client actions */}
        {user?.role === 'client' && booking.status === 'picked_up_pending_confirmation' && (
          <button
            className="btn btn-primary"
            onClick={() => updateStatusMutation.mutate({ bookingId, status: 'picked_up' })}
          >
            Confirm Vehicle Pickup
          </button>
        )}
        {user?.role === 'client' && ['delivered_to_client','delivered'].includes(booking.status) && booking.paymentStatus === 'pending' && (
          <button
            className="btn btn-primary"
            onClick={() => { window.location.href = `/client/payment/${bookingId}`; }}
          >
            Confirm Received & Proceed to Payment
          </button>
        )}

        {/* Driver actions */}
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
        {(user?.role === 'driver' || user?.role === 'carwash') && ['wash_completed','delivered_to_client','delivered'].includes(booking.status) && booking.paymentStatus === 'pending' && (
          <button className="btn btn-primary" onClick={() => confirmPaymentMutation.mutate({ bookingId })}>
            Confirm Payment
          </button>
        )}

        {/* Universal Manual Status Control (role-scoped options) */}
        {getManualStatusOptions().length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <select
              value={manualStatus}
              onChange={(e) => setManualStatus(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 6 }}
            >
              <option value="">Change Status…</option>
              {getManualStatusOptions().map((s) => (
                <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
              ))}
            </select>
            <button
              className="btn btn-secondary"
              disabled={!manualStatus || updateStatusMutation.isPending}
              onClick={() => {
                if (!manualStatus) return;
                updateStatusMutation.mutate({ bookingId, status: manualStatus });
              }}
            >
              {updateStatusMutation.isPending ? 'Updating…' : 'Update Status'}
            </button>
          </div>
        )}
      </div>
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

const getStatusSteps = (currentStatus: string) => {
  const steps = [
    { status: 'pending', label: 'Pending', icon: '⏳', completed: false, active: false },
    { status: 'accepted', label: 'Accepted', icon: '✅', completed: false, active: false },
    { status: 'picked_up', label: 'Picked Up', icon: '🚗', completed: false, active: false },
    { status: 'delivered_to_wash', label: 'Delivered to Wash', icon: '🏁', completed: false, active: false },
    { status: 'at_wash', label: 'At Wash', icon: '🧼', completed: false, active: false },
    { status: 'washing_bay', label: 'Washing', icon: '🫧', completed: false, active: false },
    { status: 'drying_bay', label: 'Drying', icon: '💨', completed: false, active: false },
    { status: 'wash_completed', label: 'Wash Complete', icon: '✨', completed: false, active: false },
    { status: 'delivered_to_client', label: 'Delivered', icon: '📌', completed: false, active: false },
    { status: 'completed', label: 'Job Completed', icon: '✅', completed: false, active: false },
  ];

  const statusOrder = ['pending', 'accepted', 'picked_up', 'delivered_to_wash', 'at_wash', 'washing_bay', 'drying_bay', 'wash_completed', 'delivered_to_client', 'completed'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  return steps.map((step, index) => {
    const stepIndex = statusOrder.indexOf(step.status);
    return {
      ...step,
      completed: stepIndex < currentIndex,
      active: stepIndex === currentIndex,
    };
  });
};

export default LiveTracking;
