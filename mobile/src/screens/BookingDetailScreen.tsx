import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CustomMapView from '../components/MapView';
import { Coordinates } from '../services/locationService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows, StatusColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

/**
 * Detailed view for a single booking.
 *
 * Shows vehicle, service, car wash, payment, and location information.
 * Implements role-based actions matching the web BookingCard:
 *   - Client: confirm pickup, cancel, confirm received & pay
 *   - Driver: accept, decline, picked_up, delivered_to_wash, return-in-progress,
 *             out-for-delivery, delivered_to_client, confirm payment
 *   - Car Wash: confirm arrival, start washing, move to drying, complete service, confirm payment
 */
const BookingDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params as { bookingId: string };
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pickupCoordinates, setPickupCoordinates] = useState<Coordinates | undefined>();
  const [destinationCoordinates, setDestinationCoordinates] = useState<Coordinates | undefined>();
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    fetchBooking();
  }, []);

  const fetchBooking = async () => {
    try {
      const response = await apiClient.get(`/bookings/${bookingId}`);
      const bookingData = response.data.data;
      setBooking(bookingData);

      // Extract coordinates if available
      if (bookingData.pickupCoordinates) {
        const coords = bookingData.pickupCoordinates;
        if (typeof coords === 'object' && coords.lat && coords.lng) {
          setPickupCoordinates({ lat: coords.lat, lng: coords.lng });
        } else if (typeof coords === 'string') {
          try {
            const parsed = JSON.parse(coords);
            if (parsed.lat && parsed.lng) {
              setPickupCoordinates({ lat: parsed.lat, lng: parsed.lng });
            }
          } catch (e) {
            const [lat, lng] = coords.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              setPickupCoordinates({ lat, lng });
            }
          }
        }
      } else if (bookingData.pickupLatitude && bookingData.pickupLongitude) {
        setPickupCoordinates({
          lat: bookingData.pickupLatitude,
          lng: bookingData.pickupLongitude,
        });
      }

      // Get car wash coordinates
      if (bookingData.carWashId?.locationCoordinates) {
        const coords = bookingData.carWashId.locationCoordinates;
        if (typeof coords === 'string') {
          try {
            const parsed = JSON.parse(coords);
            if (parsed.lat && parsed.lng) {
              setDestinationCoordinates({ lat: parsed.lat, lng: parsed.lng });
            }
          } catch (e) {
            const [lat, lng] = coords.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              setDestinationCoordinates({ lat, lng });
            }
          }
        } else if (coords && typeof coords === 'object' && coords.lat && coords.lng) {
          setDestinationCoordinates(coords);
        }
      }
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      Alert.alert('Error', error?.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  // ─── Action Handlers ───────────────────────────────────────────────────────

  const performAction = async (fn: () => Promise<any>, successMsg: string) => {
    setActionLoading(true);
    try {
      const response = await fn();
      if (response.data.success !== false) {
        Alert.alert('Success', successMsg);
        fetchBooking();
      } else {
        Alert.alert('Error', response.data.message || 'Action failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || error?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = (status: string, confirmMsg: string, successMsg: string) => {
    Alert.alert('Confirm', confirmMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => performAction(
          () => apiClient.put(`/bookings/${bookingId}/status`, { status }),
          successMsg
        ),
      },
    ]);
  };

  const handleCancelBooking = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => performAction(
          () => apiClient.put(`/bookings/${bookingId}/cancel`),
          'Booking cancelled successfully'
        ),
      },
    ]);
  };

  const handleAccept = () => {
    Alert.alert('Accept Booking', 'Accept this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: () => performAction(
          () => apiClient.put(`/drivers/bookings/${bookingId}/accept`),
          'Booking accepted'
        ),
      },
    ]);
  };

  const handleDecline = () => {
    Alert.alert('Decline Booking', 'Decline this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => performAction(
          () => apiClient.put(`/drivers/bookings/${bookingId}/decline`),
          'Booking declined'
        ),
      },
    ]);
  };

  const handleReturnInProgress = () => {
    Alert.alert('Pick from Wash', 'Confirm picking the vehicle from the car wash?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => performAction(
          () => apiClient.post(`/bookings/${bookingId}/return-in-progress`),
          'Vehicle picked from wash'
        ),
      },
    ]);
  };

  const handleOutForDelivery = () => {
    Alert.alert('Out for Delivery', 'Confirm heading to deliver the vehicle?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => performAction(
          () => apiClient.post(`/bookings/${bookingId}/out-for-delivery`),
          'Marked as out for delivery'
        ),
      },
    ]);
  };

  const handleConfirmPayment = () => {
    Alert.alert('Confirm Payment', 'Confirm that payment has been received?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => performAction(
          () => apiClient.post('/payments/confirm', { bookingId }),
          'Payment confirmed'
        ),
      },
    ]);
  };

  // ─── Status Helpers ────────────────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    return StatusColors[status] || Colors.gray500;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      accepted: 'Accepted',
      declined: 'Declined',
      picked_up: 'Picked Up',
      picked_up_pending_confirmation: 'Awaiting Client Confirmation',
      at_wash: 'At Car Wash',
      delivered_to_wash: 'Delivered to Wash',
      waiting_bay: 'Waiting Bay',
      washing_bay: 'Washing',
      drying_bay: 'Drying',
      wash_completed: 'Wash Completed',
      delivered: 'Delivered',
      delivered_to_client: 'Delivered to Client',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Render Actions Based on Role & Status ─────────────────────────────────

  const renderActions = () => {
    if (!booking || !user) return null;
    const status = booking.status;
    const role = user.role;
    const actions: JSX.Element[] = [];

    // ── Client Actions ──
    if (role === 'client') {
      // Cancel (pending or accepted)
      if (['pending', 'accepted'].includes(status)) {
        actions.push(
          <ActionButton key="cancel" label="Cancel Booking" icon="close-circle" variant="danger" onPress={handleCancelBooking} />
        );
      }

      // Confirm pickup (dual confirmation)
      if (status === 'picked_up_pending_confirmation') {
        actions.push(
          <ActionButton
            key="confirm-pickup"
            label="Confirm Vehicle Pickup"
            icon="checkmark-circle"
            variant="primary"
            onPress={() => handleStatusUpdate('picked_up', 'Confirm that the driver has picked up your vehicle?', 'Pickup confirmed')}
          />
        );
      }

      // Confirm received & pay (after delivery)
      if (['delivered_to_client', 'delivered'].includes(status) && booking.paymentStatus === 'pending') {
        actions.push(
          <ActionButton key="pay" label="Confirm Received & Pay" icon="card" variant="primary" onPress={() => {
            Alert.alert('Payment', 'Vehicle received. Please proceed with payment.', [{ text: 'OK' }]);
            // In a full implementation, navigate to a payment screen
          }} />
        );
      }
    }

    // ── Driver Actions ──
    if (role === 'driver') {
      if (status === 'pending') {
        actions.push(<ActionButton key="accept" label="Accept" icon="checkmark-circle" variant="primary" onPress={handleAccept} />);
        if (booking.driverId) {
          actions.push(<ActionButton key="decline" label="Decline" icon="close-circle" variant="danger" onPress={handleDecline} />);
        }
      }

      if (status === 'accepted') {
        actions.push(
          <ActionButton key="pickup" label="Mark Picked Up" icon="car" variant="primary"
            onPress={() => handleStatusUpdate('picked_up', 'Mark vehicle as picked up?', 'Status updated')} />
        );
        actions.push(<ActionButton key="decline2" label="Decline" icon="close-circle" variant="danger" onPress={handleDecline} />);
      }

      if (status === 'picked_up_pending_confirmation') {
        // No action, just waiting
        actions.push(
          <View key="waiting" style={styles.noticeContainer}>
            <Ionicons name="time-outline" size={16} color={Colors.warning} />
            <Text style={styles.noticeText}>Waiting for client to confirm pickup...</Text>
          </View>
        );
      }

      if (status === 'picked_up') {
        actions.push(
          <ActionButton key="to-wash" label="Delivered to Wash" icon="business" variant="primary"
            onPress={() => handleStatusUpdate('delivered_to_wash', 'Confirm delivered to car wash?', 'Status updated')} />
        );
      }

      if (status === 'wash_completed') {
        actions.push(<ActionButton key="return" label="Pick from Wash" icon="arrow-undo" variant="secondary" onPress={handleReturnInProgress} />);
        actions.push(<ActionButton key="ofd" label="Out for Delivery" icon="navigate" variant="secondary" onPress={handleOutForDelivery} />);
        actions.push(
          <ActionButton key="to-client" label="Delivered to Client" icon="checkmark-done" variant="primary"
            onPress={() => handleStatusUpdate('delivered_to_client', 'Confirm delivered to client?', 'Status updated')} />
        );
      }

      if (status === 'drying_bay') {
        actions.push(
          <ActionButton key="to-client2" label="Delivered to Client" icon="checkmark-done" variant="primary"
            onPress={() => handleStatusUpdate('delivered_to_client', 'Confirm delivered to client?', 'Status updated')} />
        );
      }

      if (['wash_completed', 'delivered_to_client', 'delivered'].includes(status) && booking.paymentStatus === 'pending') {
        actions.push(<ActionButton key="pay-confirm" label="Confirm Payment" icon="card" variant="primary" onPress={handleConfirmPayment} />);
      }
    }

    // ── Car Wash Actions ──
    if (role === 'carwash') {
      if (['delivered_to_wash', 'waiting_bay'].includes(status)) {
        actions.push(
          <ActionButton key="arrival" label="Confirm Arrival" icon="enter" variant="secondary"
            onPress={() => handleStatusUpdate('at_wash', 'Confirm vehicle arrival?', 'Status updated')} />
        );
      }

      if (['delivered_to_wash', 'waiting_bay', 'at_wash'].includes(status)) {
        actions.push(
          <ActionButton key="washing" label="Start Washing" icon="water" variant="primary"
            onPress={() => handleStatusUpdate('washing_bay', 'Move to washing bay?', 'Status updated')} />
        );
      }

      if (status === 'washing_bay') {
        actions.push(
          <ActionButton key="drying" label="Move to Drying" icon="sunny" variant="primary"
            onPress={() => handleStatusUpdate('drying_bay', 'Move to drying bay?', 'Status updated')} />
        );
      }

      if (status === 'drying_bay') {
        actions.push(
          <ActionButton key="complete" label="Complete Service" icon="checkmark-done-circle" variant="primary"
            onPress={() => handleStatusUpdate('wash_completed', 'Mark service as completed?', 'Service completed')} />
        );
      }

      if (['wash_completed', 'delivered_to_client', 'delivered'].includes(status) && booking.paymentStatus === 'pending') {
        actions.push(<ActionButton key="pay-confirm-cw" label="Confirm Payment" icon="card" variant="primary" onPress={handleConfirmPayment} />);
      }
    }

    if (actions.length === 0) return null;

    return (
      <Animatable.View animation="fadeInUp" duration={500} useNativeDriver style={styles.actionsSection}>
        {actions}
      </Animatable.View>
    );
  };

  // ─── Loading & Error States ────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.gray400} />
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Status Header */}
        <Animatable.View style={[styles.statusHeader, { backgroundColor: getStatusColor(booking.status) }]} animation="fadeIn" duration={500} useNativeDriver>
          <View style={styles.statusContent}>
            <Ionicons name="checkmark-circle" size={32} color={theme.colors.white} />
            <Text style={[styles.statusHeaderText, { color: theme.colors.white }]}>{getStatusLabel(booking.status)}</Text>
          </View>
          {booking.bookingType && (
            <Text style={styles.bookingTypeBadge}>
              {booking.bookingType === 'drive_in' ? 'Drive-In' : 'Pickup & Delivery'}
            </Text>
          )}
        </Animatable.View>

        {/* Main Card */}
        <Animatable.View animation="fadeInUp" duration={600} useNativeDriver style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          {/* Vehicle Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="car-sport" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
            </View>
            <View style={styles.infoGrid}>
              <InfoItem label="Make" value={booking.vehicleId?.make} />
              <InfoItem label="Model" value={booking.vehicleId?.model} />
              <InfoItem label="Plate Number" value={booking.vehicleId?.plateNo} />
              <InfoItem label="Color" value={booking.vehicleId?.color} />
            </View>
          </View>

          {/* Service Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Service Information</Text>
            </View>
            <InfoItem label="Service" value={booking.serviceId?.name} />
            <InfoItem label="Car Wash" value={booking.carWashId?.carWashName || booking.carWashId?.name} />
            <InfoItem label="Location" value={booking.carWashId?.location} />
          </View>

          {/* Booking Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Booking Details</Text>
            </View>
            {booking.pickupLocation && <InfoItem label="Pickup Location" value={booking.pickupLocation} />}
            <InfoItem label="Booking Date" value={formatDate(booking.createdAt || booking.created_at)} />
            {booking.driverId && <InfoItem label="Driver" value={booking.driverId.name} />}
            {booking.driverId?.phone && <InfoItem label="Driver Phone" value={booking.driverId.phone} />}
            {booking.scheduledPickupTime && <InfoItem label="Scheduled Pickup" value={formatDate(booking.scheduledPickupTime)} />}
          </View>

          {/* Payment Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Payment</Text>
            </View>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amount}>K{booking.totalAmount || '0'}</Text>
            </View>
            <InfoItem label="Payment Status" value={booking.paymentStatus || 'Pending'} />
          </View>

          {/* Map View */}
          {(pickupCoordinates || destinationCoordinates) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="map" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Location Map</Text>
              </View>
              <View style={styles.mapContainer}>
                <CustomMapView
                  pickupLocation={pickupCoordinates}
                  destinationLocation={destinationCoordinates}
                  height={250}
                  showRoute={!!(pickupCoordinates && destinationCoordinates)}
                />
              </View>
            </View>
          )}

          {/* Notes */}
          {booking.notes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Notes</Text>
              </View>
              <Text style={styles.notes}>{booking.notes}</Text>
            </View>
          )}
        </Animatable.View>

        {/* Action Buttons */}
        {actionLoading ? (
          <View style={styles.actionsSection}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          renderActions()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const InfoItem = ({ label, value }: { label: string; value: string | undefined }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || 'N/A'}</Text>
  </View>
);

interface ActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
}

const ActionButton = ({ label, icon, variant, onPress }: ActionButtonProps) => {
  const bgColor = variant === 'danger' ? Colors.error : variant === 'secondary' ? Colors.gray600 : Colors.primary;
  return (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: bgColor }]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={18} color={Colors.white} />
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusHeader: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusHeaderText: {
    color: Colors.white,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  bookingTypeBadge: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    marginTop: Spacing.xs,
    opacity: 0.9,
  },
  card: {
    backgroundColor: Colors.white,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  infoItem: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: Typography.medium,
  },
  infoValue: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  amountCard: {
    backgroundColor: Colors.primaryLight + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  amountLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  mapContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  notes: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: Typography.base * Typography.lineHeight.relaxed,
  },
  actionsSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  noticeText: {
    fontSize: Typography.sm,
    color: Colors.warning,
    fontWeight: Typography.medium,
    flex: 1,
  },
  errorText: {
    fontSize: Typography.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});

export default BookingDetailScreen;
