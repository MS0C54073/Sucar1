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
 * Shows vehicle, service, car wash, payment, and location information
 * and (for eligible statuses) lets the client cancel the booking.
 */
const BookingDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId } = route.params as { bookingId: string };
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const getStatusColor = (status: string) => {
    return StatusColors[status] || Colors.gray500;
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.put(`/bookings/${bookingId}/status`, {
                status: 'cancelled',
              });
              if (response.data.success) {
                Alert.alert('Success', 'Booking cancelled successfully');
                navigation.goBack();
              } else {
                Alert.alert('Error', response.data.message || 'Failed to cancel booking');
              }
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

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

  const canCancel = ['pending', 'accepted'].includes(booking.status);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Status Header */}
        <Animatable.View style={[styles.statusHeader, { backgroundColor: getStatusColor(booking.status) }]} animation="fadeIn" duration={500} useNativeDriver>
          <View style={styles.statusContent}>
            <Ionicons name="checkmark-circle" size={32} color={theme.colors.white} />
            <Text style={[styles.statusText, { color: theme.colors.white }]}>{getStatusLabel(booking.status)}</Text>
          </View>
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
            <InfoItem label="Pickup Location" value={booking.pickupLocation} />
            <InfoItem label="Booking Date" value={formatDate(booking.createdAt || booking.created_at)} />
            {booking.driverId && <InfoItem label="Driver" value={booking.driverId.name} />}
            {booking.driverId?.phone && <InfoItem label="Driver Phone" value={booking.driverId.phone} />}
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
        {canCancel && (
          <Animatable.View animation="fadeInUp" duration={500} useNativeDriver style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelBooking}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={Colors.white} />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string | undefined }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || 'N/A'}</Text>
  </View>
);

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
  statusText: {
    color: Colors.white,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
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
  actions: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: Colors.error,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  cancelButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  errorText: {
    fontSize: Typography.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});

export default BookingDetailScreen;
