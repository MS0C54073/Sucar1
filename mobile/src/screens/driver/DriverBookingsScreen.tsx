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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import {
  getStatusColor,
  getStatusLabel,
  getDriverNextAction,
  getDriverWaitingHint,
  type DriverAction,
} from '../../constants/bookingStatus';
import { DriverColors, AppLayout } from '../../constants/sucarTheme';
import TabPageHeader from '../../components/layout/TabPageHeader';
import { useTheme } from '../../context/ThemeContext';

/**
 * List screen of bookings assigned to the logged‑in driver.
 *
 * Allows drivers to accept pending bookings and progress them
 * through key status changes (picked up, delivered, etc.).
 */
const DriverBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      console.error('Accept booking error:', error);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
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
      console.error('Update status error:', error);
    }
  };

  const handlePost = async (path: string, successMsg: string) => {
    try {
      const response = await apiClient.post(path);
      if (response.data.success) {
        Alert.alert('Success', successMsg);
        fetchBookings();
      } else {
        Alert.alert('Error', response.data.message || 'Action failed');
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || 'Action failed';
      Alert.alert('Error', errorMessage);
      console.error('Driver action error:', error);
    }
  };

  const runDriverAction = (bookingId: string, action: DriverAction) => {
    switch (action.kind) {
      case 'accept':
        return handleAccept(bookingId);
      case 'status':
        return handleStatusUpdate(bookingId, action.apiStatus as string);
      case 'return':
        return handlePost(`/bookings/${bookingId}/return-in-progress`, 'Return started');
      case 'delivery':
        return handlePost(`/bookings/${bookingId}/out-for-delivery`, 'Marked out for delivery');
      default:
        return undefined;
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

  const renderBooking = ({ item, index }: any) => {
    const nextAction = getDriverNextAction(item);
    const waitingHint = nextAction ? null : getDriverWaitingHint(item.status);

    return (
      <Animatable.View animation="fadeInUp" duration={600} delay={(index || 0) * 80} useNativeDriver>
        <TouchableOpacity
          style={[styles.bookingCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id || item._id } as never)}
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
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.colors.white }]}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

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
        </View>

        <View style={styles.bookingFooter}>
            <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Amount</Text>
            <Text style={[styles.amount, { color: theme.colors.primary }]}>K{item.totalAmount || '0'}</Text>
          </View>
          {nextAction ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={(e) => {
                e.stopPropagation();
                runDriverAction(item.id || item._id, nextAction);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name={nextAction.icon} size={16} color={theme.colors.white} />
              <Text style={[styles.actionButtonText, { color: theme.colors.white }]}>{nextAction.label}</Text>
            </TouchableOpacity>
          ) : waitingHint ? (
            <View style={styles.waitingHint}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.waitingHintText} numberOfLines={2}>{waitingHint}</Text>
            </View>
          ) : null}
        </View>
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
        <TabPageHeader title="Jobs" subtitle="Assigned bookings and status updates" variant="driver" />
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item: any) => item.id || item._id || String(Math.random())}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DriverColors.primary} />
          }
          ListEmptyComponent={
            <Animatable.View animation="fadeIn" duration={500} style={styles.empty}>
              <Ionicons name="calendar-outline" size={64} color={DriverColors.textMuted} />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptyText}>
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
    backgroundColor: DriverColors.background,
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
    backgroundColor: DriverColors.surface,
    padding: Spacing.md,
    borderRadius: AppLayout.cardRadius,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: DriverColors.border,
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
  },
  statusText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
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
  waitingHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 1,
    maxWidth: '60%',
  },
  waitingHintText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    flexShrink: 1,
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
