import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows, StatusColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

/**
 * Booking status flow for drivers (pickup & delivery):
 *   pending -> accepted -> picked_up (triggers picked_up_pending_confirmation)
 *   -> picked_up (client confirms) -> delivered_to_wash -> at_wash
 *   -> washing_bay -> drying_bay -> wash_completed
 *   -> return-in-progress / out-for-delivery -> delivered_to_client -> completed
 *
 * This screen implements ALL driver-actionable transitions matching the web frontend.
 */

interface ActionDef {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

const DriverBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigation = useNavigation() as any;
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get('/drivers/bookings');
      setBookings(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', error?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleAccept = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const response = await apiClient.put(`/drivers/bookings/${bookingId}/accept`);
      if (response.data.success) {
        Alert.alert('Success', 'Booking accepted successfully');
        fetchBookings();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to accept booking');
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to accept booking';
      Alert.alert('Error', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (bookingId: string) => {
    Alert.alert('Decline Booking', 'Are you sure you want to decline this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Decline',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(bookingId);
          try {
            const response = await apiClient.put(`/drivers/bookings/${bookingId}/decline`);
            if (response.data.success) {
              Alert.alert('Success', 'Booking declined');
              fetchBookings();
            } else {
              Alert.alert('Error', response.data.message || 'Failed to decline booking');
            }
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to decline booking');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleStatusUpdate = async (bookingId: string, status: string, confirmMessage: string) => {
    Alert.alert('Confirm Action', confirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoading(bookingId);
          try {
            const response = await apiClient.put(`/bookings/${bookingId}/status`, { status });
            if (response.data.success) {
              Alert.alert('Success', 'Status updated successfully');
              fetchBookings();
            } else {
              Alert.alert('Error', response.data.message || 'Failed to update status');
            }
          } catch (error: any) {
            const errorMessage = error?.message || error?.response?.data?.message || 'Failed to update status';
            Alert.alert('Error', errorMessage);
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleReturnInProgress = async (bookingId: string) => {
    Alert.alert('Pick from Wash', 'Confirm you are picking the vehicle from the car wash?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoading(bookingId);
          try {
            const response = await apiClient.post(`/bookings/${bookingId}/return-in-progress`);
            if (response.data.success) {
              Alert.alert('Success', 'Vehicle picked from wash (return in progress)');
              fetchBookings();
            } else {
              Alert.alert('Error', response.data.message || 'Failed to mark return in progress');
            }
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to mark return in progress');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleOutForDelivery = async (bookingId: string) => {
    Alert.alert('Out for Delivery', 'Confirm you are heading to deliver the vehicle to the client?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoading(bookingId);
          try {
            const response = await apiClient.post(`/bookings/${bookingId}/out-for-delivery`);
            if (response.data.success) {
              Alert.alert('Success', 'Marked as out for delivery');
              fetchBookings();
            } else {
              Alert.alert('Error', response.data.message || 'Failed to mark out for delivery');
            }
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to mark out for delivery');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleConfirmPayment = async (bookingId: string) => {
    Alert.alert('Confirm Payment', 'Confirm that payment has been received from the client?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm Payment',
        onPress: async () => {
          setActionLoading(bookingId);
          try {
            const response = await apiClient.post('/payments/confirm', { bookingId });
            if (response.data.success) {
              Alert.alert('Success', 'Payment confirmed successfully');
              fetchBookings();
            } else {
              Alert.alert('Error', response.data.message || 'Failed to confirm payment');
            }
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to confirm payment');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

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

  /**
   * Returns all available actions for the driver based on the current booking status.
   * Matches the web frontend BookingCard logic exactly.
   */
  const getActions = (item: any): ActionDef[] => {
    const status = item.status;
    const actions: ActionDef[] = [];

    if (status === 'pending') {
      actions.push({ label: 'Accept', icon: 'checkmark-circle', action: 'accept', variant: 'primary' });
      if (item.driverId) {
        actions.push({ label: 'Decline', icon: 'close-circle', action: 'decline', variant: 'danger' });
      }
    }

    if (status === 'accepted') {
      actions.push({ label: 'Mark Picked Up', icon: 'car', action: 'picked_up', variant: 'primary' });
      actions.push({ label: 'Decline', icon: 'close-circle', action: 'decline', variant: 'danger' });
    }

    // picked_up_pending_confirmation: waiting for client, no driver action
    // picked_up (confirmed): deliver to wash
    if (status === 'picked_up') {
      actions.push({ label: 'Delivered to Wash', icon: 'business', action: 'delivered_to_wash', variant: 'primary' });
    }

    // wash_completed: driver can pick from wash, mark out for delivery, or deliver to client
    if (status === 'wash_completed') {
      actions.push({ label: 'Pick from Wash', icon: 'arrow-undo', action: 'return_in_progress', variant: 'secondary' });
      actions.push({ label: 'Out for Delivery', icon: 'navigate', action: 'out_for_delivery', variant: 'secondary' });
      actions.push({ label: 'Delivered to Client', icon: 'checkmark-done', action: 'delivered_to_client', variant: 'primary' });
    }

    // drying_bay: driver can also mark delivered to client (same as web)
    if (status === 'drying_bay') {
      actions.push({ label: 'Delivered to Client', icon: 'checkmark-done', action: 'delivered_to_client', variant: 'primary' });
    }

    // Payment confirmation for driver when payment is pending
    if (['wash_completed', 'delivered_to_client', 'delivered'].includes(status) && item.paymentStatus === 'pending') {
      actions.push({ label: 'Confirm Payment', icon: 'card', action: 'confirm_payment', variant: 'primary' });
    }

    return actions;
  };

  const executeAction = (bookingId: string, action: string) => {
    switch (action) {
      case 'accept':
        handleAccept(bookingId);
        break;
      case 'decline':
        handleDecline(bookingId);
        break;
      case 'picked_up':
        handleStatusUpdate(bookingId, 'picked_up', 'Mark this vehicle as picked up from the client?');
        break;
      case 'delivered_to_wash':
        handleStatusUpdate(bookingId, 'delivered_to_wash', 'Confirm vehicle delivered to the car wash?');
        break;
      case 'delivered_to_client':
        handleStatusUpdate(bookingId, 'delivered_to_client', 'Confirm vehicle delivered back to the client?');
        break;
      case 'return_in_progress':
        handleReturnInProgress(bookingId);
        break;
      case 'out_for_delivery':
        handleOutForDelivery(bookingId);
        break;
      case 'confirm_payment':
        handleConfirmPayment(bookingId);
        break;
      default:
        handleStatusUpdate(bookingId, action, `Update status to ${action.replace(/_/g, ' ')}?`);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getActionButtonStyle = (variant?: string) => {
    switch (variant) {
      case 'danger':
        return { backgroundColor: Colors.error };
      case 'secondary':
        return { backgroundColor: Colors.gray600 };
      default:
        return { backgroundColor: theme.colors.primary };
    }
  };

  const renderBooking = ({ item, index }: any) => {
    const actions = getActions(item);
    const bookingId = item.id || item._id;
    const isThisLoading = actionLoading === bookingId;

    return (
      <Animatable.View animation="fadeInUp" duration={600} delay={(index || 0) * 80} useNativeDriver>
        <TouchableOpacity
          style={[styles.bookingCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('BookingDetail', { bookingId } as never)}
          activeOpacity={0.7}
        >
          <View style={styles.bookingHeader}>
            <View style={styles.bookingTitleContainer}>
              <Ionicons name="car-sport" size={20} color={theme.colors.primary} style={styles.vehicleIcon} />
              <View style={styles.bookingTitleText}>
                <Text style={[styles.bookingTitle, { color: theme.colors.textPrimary }]}>
                  {item.vehicleId?.make} {item.vehicleId?.model}
                </Text>
                <Text style={[styles.bookingDate, { color: theme.colors.textTertiary }]}>{formatDate(item.createdAt || item.created_at)}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={[styles.statusText, { color: theme.colors.white }]}>{getStatusLabel(item.status)}</Text>
            </View>
          </View>

          {/* Waiting notice for pending confirmation */}
          {item.status === 'picked_up_pending_confirmation' && (
            <View style={styles.noticeContainer}>
              <Ionicons name="time-outline" size={16} color={Colors.warning} />
              <Text style={styles.noticeText}>Waiting for client to confirm pickup...</Text>
            </View>
          )}

          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.bookingInfo}>Client: {item.clientId?.name || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.bookingInfo} numberOfLines={1}>
                Pickup: {item.pickupLocation || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.bookingInfo}>
                {item.carWashId?.carWashName || item.carWashId?.name || 'N/A'}
              </Text>
            </View>
            {item.bookingType && (
              <View style={styles.detailRow}>
                <Ionicons name="swap-horizontal-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.bookingInfo}>
                  {item.bookingType === 'drive_in' ? 'Drive-In' : 'Pickup & Delivery'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bookingFooter}>
            <View style={styles.amountContainer}>
              <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.amount, { color: theme.colors.primary }]}>K{item.totalAmount || '0'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {actions.length > 0 && (
            <View style={styles.actionsContainer}>
              {actions.map((actionDef, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.actionButton, getActionButtonStyle(actionDef.variant)]}
                  onPress={(e) => {
                    e.stopPropagation();
                    executeAction(bookingId, actionDef.action);
                  }}
                  activeOpacity={0.7}
                  disabled={isThisLoading}
                >
                  {isThisLoading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name={actionDef.icon} size={16} color={Colors.white} />
                      <Text style={styles.actionButtonText}>{actionDef.label}</Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </Animatable.View>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item: any) => item.id || item._id || String(Math.random())}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          ListEmptyComponent={
            <Animatable.View animation="fadeIn" duration={500} style={styles.empty}>
              <Ionicons name="calendar-outline" size={64} color={theme.colors.gray400} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No bookings found</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                You don't have any bookings assigned yet. Check back later!
              </Text>
            </Animatable.View>
          }
          contentContainerStyle={bookings.length === 0 ? styles.emptyContainer : styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
  },
  bookingCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  bookingTitleContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  vehicleIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  bookingTitleText: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  bookingDate: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    maxWidth: 140,
  },
  statusText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    textAlign: 'center',
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  noticeText: {
    fontSize: Typography.sm,
    color: Colors.warning,
    fontWeight: Typography.medium,
    flex: 1,
  },
  bookingDetails: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  bookingInfo: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  amountLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default DriverBookingsScreen;
