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
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows, StatusColors } from '../../constants/theme';

/**
 * List screen showing all bookings for the logged‑in client.
 *
 * Supports searching by vehicle, car wash, service, or pickup location,
 * and filtering by booking status (active, pending, completed, cancelled).
 */
const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const navigation = useNavigation() as any;
  const { user } = useAuth();

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterAndSearchBookings();
  }, [bookings, searchQuery, selectedFilter]);

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get('/bookings');
      setBookings(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', error?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSearchBookings = () => {
    let filtered = [...bookings];

    // Apply status filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'active') {
        filtered = filtered.filter(
          (b: any) => !['completed', 'cancelled', 'delivered'].includes(b.status)
        );
      } else {
        filtered = filtered.filter((b: any) => {
          if (selectedFilter === 'completed') {
            return ['completed', 'delivered'].includes(b.status);
          }
          return b.status === selectedFilter;
        });
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((b: any) => {
        const vehicleName = `${b.vehicleId?.make || ''} ${b.vehicleId?.model || ''}`.toLowerCase();
        const carWashName = (b.carWashId?.carWashName || b.carWashId?.name || '').toLowerCase();
        const serviceName = (b.serviceId?.name || '').toLowerCase();
        const pickupLocation = (b.pickupLocation || '').toLowerCase();
        return (
          vehicleName.includes(query) ||
          carWashName.includes(query) ||
          serviceName.includes(query) ||
          pickupLocation.includes(query)
        );
      });
    }

    // Sort by date (newest first)
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dateB - dateA;
    });

    setFilteredBookings(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderBooking = ({ item }: any) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id || item._id } as never)}
      activeOpacity={0.7}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingTitleContainer}>
          <Ionicons name="car-sport" size={20} color={Colors.primary} style={styles.vehicleIcon} />
          <View style={styles.bookingTitleText}>
            <Text style={styles.bookingTitle}>
              {item.vehicleId?.make} {item.vehicleId?.model}
            </Text>
            <Text style={styles.bookingDate}>{formatDate(item.createdAt || item.created_at)}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.bookingInfo}>
            {item.carWashId?.carWashName || item.carWashId?.name || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="sparkles-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.bookingInfo}>{item.serviceId?.name || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.bookingInfo} numberOfLines={1}>
            {item.pickupLocation || 'N/A'}
          </Text>
        </View>
        {item.driverId && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.bookingInfo}>{item.driverId.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.bookingFooter}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>K{item.totalAmount || '0'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Loading bookings...</Text>
        </View>
      );
    }

    if (filteredBookings.length === 0) {
      return (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={64} color={Colors.gray400} />
          <Text style={styles.emptyTitle}>
            {searchQuery || selectedFilter !== 'all'
              ? 'No bookings found'
              : 'No bookings yet'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery || selectedFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Start by creating your first booking'}
          </Text>
          {!searchQuery && selectedFilter === 'all' && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Booking' as never)}
            >
              <Text style={styles.emptyButtonText}>Create Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={Colors.gray400} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search bookings..."
              placeholderTextColor={Colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={20} color={Colors.primary} />
            {selectedFilter !== 'all' && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filter Display */}
        {selectedFilter !== 'all' && (
          <View style={styles.activeFilterContainer}>
            <View style={styles.activeFilter}>
              <Text style={styles.activeFilterText}>
                Filter: {statusFilters.find((f) => f.value === selectedFilter)?.label}
              </Text>
              <TouchableOpacity onPress={() => setSelectedFilter('all')}>
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FlatList
          data={filteredBookings}
          renderItem={renderBooking}
          keyExtractor={(item: any) => item.id || item._id || String(Math.random())}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            filteredBookings.length === 0 ? styles.emptyContainer : styles.listContainer
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter by Status</Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
              {statusFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter.value && styles.filterOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedFilter(filter.value);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedFilter === filter.value && styles.filterOptionTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                  {selectedFilter === filter.value && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: Typography.bold,
  },
  activeFilterContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.infoLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  activeFilterText: {
    fontSize: Typography.sm,
    color: Colors.info,
    fontWeight: Typography.medium,
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
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  filterOptionActive: {
    backgroundColor: Colors.primaryLight + '20',
  },
  filterOptionText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  filterOptionTextActive: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
});

export default MyBookingsScreen;
