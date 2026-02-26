import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import ChatWindow from '../chat/ChatWindow';
import QueueDisplay from '../queue/QueueDisplay';
import QueueEstimate from './QueueEstimate';
import { useToast } from '../ToastContainer';
import './BookingCard.css';

interface BookingCardProps {
  booking: any;
  onStatusUpdate?: () => void;
}

const BookingCard = ({ booking, onStatusUpdate }: BookingCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  // Temporary safeguard: if backend DB hasn't applied the status migration,
  // attempting to set 'picked_up' (mapped server-side to 'picked_up_pending_confirmation')
  // will fail with bookings_status_check. When detected, we block further pickup attempts
  // and show a clear instruction to the user/admin.
  const [pickupBlocked, setPickupBlocked] = useState(false);

  // Determine chat receiver
  const getChatReceiver = () => {
    if (user?.role === 'client') {
      return booking.driverId?.id || booking.driverId || booking.carWashId?.id || booking.carWashId;
    } else if (user?.role === 'driver') {
      return booking.clientId?.id || booking.clientId;
    } else if (user?.role === 'carwash') {
      return booking.clientId?.id || booking.clientId;
    }
    return null;
  };

  const getChatReceiverName = () => {
    if (user?.role === 'client') {
      return booking.driverId?.name || booking.carWashId?.carWashName || booking.carWashId?.name || 'Contact';
    } else if (user?.role === 'driver' || user?.role === 'carwash') {
      return booking.clientId?.name || 'Client';
    }
    return 'Contact';
  };

  const receiverId = getChatReceiver();
  const receiverName = getChatReceiverName();
  const bookingId = booking.id || booking._id;

  // Mutation for updating booking status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, bookingId }: { status: string; bookingId: string }) => {
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }
      if (!status) {
        throw new Error('Status is required');
      }

      const response = await api.put(`/bookings/${bookingId}/status`, { status });

      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }

      if (response.data.success === false) {
        throw new Error(response.data.message || 'Failed to update status');
      }

      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate all booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carwash-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carwash-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      onStatusUpdate?.();
      showToast(`Status updated to ${variables.status.replace(/_/g, ' ')}`, 'success');
    },
    onError: (error: any) => {
      console.error('❌ Error updating booking status:', error);
      const rawMessage = error.response?.data?.message || error.message || 'Failed to update status';
      // Detect database check constraint errors related to booking status
      if (typeof rawMessage === 'string' && rawMessage.includes('bookings_status_check')) {
        setPickupBlocked(true);
        showToast(
          'Pickup confirmation requires a backend migration. Please ask an admin to run supabase/migrations/20260223091000_add_all_booking_statuses.sql and restart the API.',
          'error'
        );
      } else {
        showToast(rawMessage, 'error');
      }
    },
  });

  // Confirm payment (driver/carwash)
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => {
      const response = await api.post('/payments/confirm', { bookingId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carwash-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      showToast('Payment confirmed successfully', 'success');
      onStatusUpdate?.();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to confirm payment', 'error');
    },
  });

  // Driver side: return in progress and out for delivery flags
  const markReturnMutation = useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => {
      const response = await api.post(`/bookings/${bookingId}/return-in-progress`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      showToast('Vehicle picked from wash (return in progress)', 'success');
      onStatusUpdate?.();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to mark return in progress', 'error');
    },
  });

  const markOutForDeliveryMutation = useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => {
      const response = await api.post(`/bookings/${bookingId}/out-for-delivery`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings'] });
      showToast('Out for delivery to client', 'success');
      onStatusUpdate?.();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to mark out for delivery', 'error');
    },
  });

  // Get unread message count for this specific booking
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count', bookingId],
    queryFn: async () => {
      try {
        // Get messages for this booking and count unread
        const response = await api.get(`/chat/booking/${bookingId}`);
        const messages = response.data.data || [];
        return messages.filter((msg: any) => !msg.read && (msg.receiverId === user?.id || msg.receiver_id === user?.id)).length;
      } catch {
        return 0;
      }
    },
    refetchInterval: 10000,
    enabled: !!receiverId,
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="booking-card">
        <div className="booking-card-header">
          <div className="booking-header-left">
            <span className={`status-badge status-${booking.status}`}>
              {booking.status.replace(/_/g, ' ')}
            </span>
            <span className="booking-type-badge">
              {booking.bookingType === 'drive_in' ? '🚗 Drive-In' : '🚚 Pickup & Delivery'}
            </span>
          </div>
          <div className="booking-header-right">
            <span className="booking-date">{formatDate(booking.createdAt)}</span>
          </div>
        </div>

        <div className="booking-card-body">
          {/* Payment pending banner */}
          {['wash_completed', 'delivered_to_client', 'delivered'].includes(booking.status) && booking.paymentStatus === 'pending' && (
            <div className="status-notice warning" style={{ marginBottom: 12 }}>
              <span>💳 Payment pending — driver or car wash must confirm after client pays.</span>
            </div>
          )}
          <div className="booking-info-grid">
            <div className="info-item">
              <span className="info-label">Car Wash</span>
              <span className="info-value">
                {booking.carWashId?.carWashName || booking.carWashId?.name || 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Service</span>
              <span className="info-value">{booking.serviceId?.name || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Vehicle</span>
              <span className="info-value">
                {booking.vehicleId?.make} {booking.vehicleId?.model} - {booking.vehicleId?.plateNo}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Amount</span>
              <span className="info-value amount">K{parseFloat(booking.totalAmount || 0).toFixed(2)}</span>
            </div>
            {booking.pickupLocation && (
              <div className="info-item">
                <span className="info-label">Pickup Location</span>
                <span className="info-value">{booking.pickupLocation}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Payment</span>
              <span className={`info-value payment-status ${booking.paymentStatus}`}>
                {booking.paymentStatus}
              </span>
            </div>
          </div>

          {/* Queue Display for Drive-In Bookings */}
          {booking.bookingType === 'drive_in' && booking.carWashId && (
            <div className="booking-queue-section">
              <QueueDisplay bookingId={bookingId} carWashId={booking.carWashId} />
              <QueueEstimate
                queuePosition={booking.queuePosition}
                estimatedWaitTime={booking.estimatedWaitTime}
              />
            </div>
          )}

          {/* Queue Estimate for Pickup & Delivery Bookings */}
          {booking.bookingType === 'pickup_delivery' && booking.queuePosition && (
            <QueueEstimate
              queuePosition={booking.queuePosition}
              estimatedWaitTime={booking.estimatedWaitTime}
            />
          )}
        </div>

        <div className="booking-card-actions">
          {user?.role === 'client' && booking.status === 'pending' && (
            <button
              className="action-btn cancel-btn"
              onClick={async () => {
                if (confirm('Cancel this booking?')) {
                  await api.put(`/bookings/${bookingId}/cancel`);
                  onStatusUpdate?.();
                }
              }}
            >
              Cancel
            </button>
          )}

          {user?.role === 'client' && booking.status === 'wash_completed' && booking.paymentStatus === 'pending' && (
            <button
              className="action-btn primary-btn"
              onClick={() => navigate(`/client/payment/${bookingId}`)}
            >
              Make Payment
            </button>
          )}

          {user?.role === 'client' && booking.status === 'picked_up_pending_confirmation' && (
            <button
              className="action-btn primary-btn pulse"
              onClick={() => {
                if (confirm('Confirm that the driver has picked up your vehicle?')) {
                  updateStatusMutation.mutate({ bookingId, status: 'picked_up' });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Confirming...' : 'Confirm Vehicle Pickup'}
            </button>
          )}

          {['client', 'driver', 'carwash', 'admin'].includes(user?.role || '') && ['accepted', 'picked_up', 'picked_up_pending_confirmation', 'at_wash', 'delivered_to_wash', 'waiting_bay', 'washing_bay', 'drying_bay', 'wash_completed', 'delivered_to_client'].includes(booking.status) && (
            <button
              className="action-btn primary-btn"
              onClick={() => {
                const event = new CustomEvent('openTracking', { detail: { bookingId } });
                window.dispatchEvent(event);
              }}
            >
              Track Live
            </button>
          )}

          {/* Driver Actions */}
          {user?.role === 'driver' && booking.status === 'pending' && (!booking.driverId || (typeof booking.driverId === 'object' ? booking.driverId.id === user.id : booking.driverId === user.id)) && (
            <div className="action-buttons-group">
              <button
                className="action-btn primary-btn"
                onClick={async () => {
                  if (confirm('Accept this booking?')) {
                    try {
                      await api.put(`/drivers/bookings/${bookingId}/accept`);
                      onStatusUpdate?.();
                    } catch (error: any) {
                      alert(error.response?.data?.message || 'Failed to accept booking');
                    }
                  }
                }}
              >
                Accept Booking
              </button>
              {booking.driverId && (
                <button
                  className="action-btn danger-btn"
                  onClick={async () => {
                    if (confirm('Decline this booking request?')) {
                      try {
                        await api.put(`/drivers/bookings/${bookingId}/decline`);
                        onStatusUpdate?.();
                      } catch (error: any) {
                        alert(error.response?.data?.message || 'Failed to decline booking');
                      }
                    }
                  }}
                >
                  Decline
                </button>
              )}
            </div>
          )}

          {user?.role === 'driver' && booking.status === 'accepted' && (
            <div className="action-buttons-group">
              {pickupBlocked ? (
                <button
                  className="action-btn primary-btn"
                  title="Action temporarily disabled until backend migration is applied"
                  disabled
                >
                  Mark as Picked Up (Blocked)
                </button>
              ) : (
                <button
                  className="action-btn primary-btn"
                  onClick={() => {
                    if (confirm('Mark vehicle as picked up?')) {
                      updateStatusMutation.mutate({ bookingId, status: 'picked_up' });
                    }
                  }}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Mark as Picked Up'}
                </button>
              )}
              <button
                className="action-btn danger-btn"
                onClick={async () => {
                  if (confirm('Are you sure you want to decline/cancel this booking? It will be returned to the pending pool.')) {
                    try {
                      await api.put(`/drivers/bookings/${bookingId}/decline`);
                      onStatusUpdate?.();
                    } catch (error: any) {
                      alert(error.response?.data?.message || 'Failed to decline booking');
                    }
                  }
                }}
              >
                Decline/Cancel
              </button>
            </div>
          )}

          {user?.role === 'driver' && booking.status === 'picked_up_pending_confirmation' && (
            <div className="status-notice warning">
              <span>⏳ Waiting for client to confirm pickup...</span>
            </div>
          )}

          {user?.role === 'driver' && booking.status === 'picked_up' && booking.driverId === user.id && (
            <button
              className="action-btn primary-btn"
              onClick={() => {
                if (confirm('Mark as delivered to car wash?')) {
                  updateStatusMutation.mutate({ bookingId, status: 'delivered_to_wash' });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Delivered to Car Wash'}
            </button>
          )}

          {user?.role === 'driver' && ['wash_completed', 'drying_bay'].includes(booking.status) && booking.driverId === user.id && (
            <button
              className="action-btn primary-btn"
              onClick={() => {
                if (confirm('Mark as delivered to client?')) {
                  updateStatusMutation.mutate({ bookingId, status: 'delivered_to_client' });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Delivered to Client'}
            </button>
          )}

          {user?.role === 'driver' && booking.status === 'wash_completed' && (
            <div className="action-buttons-group">
              <button
                className="action-btn secondary-btn"
                onClick={() => {
                  if (confirm('Pick vehicle from wash and start return?')) {
                    markReturnMutation.mutate({ bookingId });
                  }
                }}
                disabled={markReturnMutation.isPending}
              >
                {markReturnMutation.isPending ? 'Updating...' : 'Pick from Wash'}
              </button>
              <button
                className="action-btn secondary-btn"
                onClick={() => {
                  if (confirm('Start delivery to client?')) {
                    markOutForDeliveryMutation.mutate({ bookingId });
                  }
                }}
                disabled={markOutForDeliveryMutation.isPending}
              >
                {markOutForDeliveryMutation.isPending ? 'Updating...' : 'Out for Delivery'}
              </button>
            </div>
          )}

          {/* Client flow: after delivery, confirm received leads to payment page; Job closes after payment confirmation */}
          {user?.role === 'client' && ['delivered_to_client','delivered'].includes(booking.status) && booking.paymentStatus === 'pending' && (
            <button
              className="action-btn primary-btn"
              onClick={() => navigate(`/client/payment/${bookingId}`)}
            >
              Confirm Vehicle Received & Pay
            </button>
          )}

          {/* Car Wash Actions */}
          {user?.role === 'carwash' && ((booking.bookingType === 'drive_in' && booking.status === 'waiting_bay') || booking.status === 'delivered_to_wash') && (
            <button
              className="action-btn secondary-btn"
              onClick={() => {
                if (confirm('Confirm vehicle arrival at car wash?')) {
                  updateStatusMutation.mutate({ bookingId, status: 'at_wash' });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Confirm Arrival'}
            </button>
          )}
          {user?.role === 'carwash' && ['delivered_to_wash', 'waiting_bay','at_wash'].includes(booking.status) && (
            <button
              className="action-btn primary-btn"
              onClick={() => {
                if (confirm('Move to washing bay?')) {
                  updateStatusMutation.mutate({ bookingId, status: 'washing_bay' });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Start Washing'}
            </button>
          )}

          {user?.role === 'carwash' && booking.status === 'washing_bay' && (
            <button
              className="action-btn primary-btn"
              onClick={() => {
                if (confirm('Move to drying bay?')) {
                  updateStatusMutation.mutate({ bookingId, status: 'drying_bay' });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Move to Drying'}
            </button>
          )}

          {user?.role === 'carwash' && booking.status === 'drying_bay' && (
            <button
              className="action-btn primary-btn"
              onClick={() => {
                if (confirm('Mark service as completed?')) {
                  updateStatusMutation.mutate({ bookingId, status: 'wash_completed' });
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Complete Service'}
            </button>
          )}

          {/* Payment Confirmation (Driver or Car Wash) */}
          {(user?.role === 'driver' || user?.role === 'carwash') && ['wash_completed','delivered_to_client','delivered'].includes(booking.status) && booking.paymentStatus === 'pending' && (
            <button
              className="action-btn primary-btn"
              onClick={() => {
                if (confirm('Confirm that payment proof has been reviewed and accepted?')) {
                  confirmPaymentMutation.mutate({ bookingId });
                }
              }}
              disabled={confirmPaymentMutation.isPending}
            >
              {confirmPaymentMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
            </button>
          )}

          {receiverId && (
            <button
              className="action-btn chat-btn"
              onClick={() => setShowChat(true)}
            >
              💬 Chat {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>
          )}

          <button
            className="action-btn secondary-btn"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'View'} Details
          </button>
        </div>

        {showDetails && (
          <div className="booking-details-expanded">
            <div className="details-section">
              <h4>Booking Information</h4>
              <div className="details-grid">
                <div><strong>Booking ID:</strong> {bookingId}</div>
                <div><strong>Created:</strong> {formatDate(booking.createdAt)} at {formatTime(booking.createdAt)}</div>
                {booking.scheduledPickupTime && (
                  <div><strong>Scheduled:</strong> {formatDate(booking.scheduledPickupTime)} at {formatTime(booking.scheduledPickupTime)}</div>
                )}
                {booking.driverId && (
                  <div><strong>Driver:</strong> {booking.driverId?.name || 'Assigned'}</div>
                )}
                {booking.bookingType && (
                  <div><strong>Service Type:</strong> {booking.bookingType === 'drive_in' ? 'Drive-In' : 'Pickup & Delivery'}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showChat && receiverId && (
        <div className="chat-modal-overlay" onClick={() => setShowChat(false)}>
          <div className="chat-modal-content" onClick={(e) => e.stopPropagation()}>
            <ChatWindow
              bookingId={bookingId}
              receiverId={receiverId}
              receiverName={receiverName}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BookingCard;
