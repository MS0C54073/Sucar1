import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../utils/api';
import GradientBackground from '../../components/common/GradientBackground';
import StatCard from '../../components/common/StatCard';
import ActionCard from '../../components/common/ActionCard';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

/**
 * Main home/dashboard screen for client users.
 *
 * Shows booking and vehicle statistics, a search bar for carwash discovery,
 * and quick actions (new booking, bookings list, vehicles).
 * The "More" grid has been removed – those items now live in
 * the bottom tab bar and the side drawer.
 */
const ClientHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalVehicles: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const bookingsResponse = await apiClient.get('/bookings');
      const bookings = bookingsResponse.data.data || [];

      const vehiclesResponse = await apiClient.get('/vehicles');
      const vehicles = vehiclesResponse.data.data || [];

      const activeBookings = bookings.filter(
        (b: any) => !['completed', 'cancelled', 'delivered'].includes(b.status),
      );
      const completedBookings = bookings.filter(
        (b: any) => ['completed', 'delivered'].includes(b.status),
      );

      setStats({
        totalBookings: bookings.length,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
        totalVehicles: vehicles.length,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <GradientBackground style={styles.header}>
          <Animatable.View animation="fadeInDown" duration={700} useNativeDriver style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.greeting, { color: theme.colors.textPrimary }]}>Hello,</Text>
                <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                  {user?.name?.split(' ')[0] || 'User'}
                </Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: theme.colors.textPrimary }]}>
              Let's get your car sparkling clean!
            </Text>
          </Animatable.View>
        </GradientBackground>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={Colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search carwash locations…"
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
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard title="Total Bookings" value={stats.totalBookings} icon="calendar-outline" iconColor={Colors.primary} />
          <StatCard title="Active" value={stats.activeBookings} icon="time-outline" iconColor={Colors.info} />
          <StatCard title="Completed" value={stats.completedBookings} icon="checkmark-circle-outline" iconColor={Colors.success} />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ActionCard
            title="Book Now"
            description="Book a car wash pickup service"
            icon="add-circle-outline"
            iconColor={Colors.primary}
            onPress={() => navigation.navigate('Booking')}
          />
          <ActionCard
            title="My Bookings"
            description="View and manage all your bookings"
            icon="list-outline"
            iconColor={Colors.info}
            badge={stats.activeBookings > 0 ? stats.activeBookings : undefined}
            onPress={() => navigation.navigate('MyBookings')}
          />
          <ActionCard
            title="My Vehicles"
            description={`Manage your ${stats.totalVehicles} vehicle${stats.totalVehicles !== 1 ? 's' : ''}`}
            icon="car-outline"
            iconColor={Colors.success}
            badge={stats.totalVehicles > 0 ? stats.totalVehicles : undefined}
            onPress={() => navigation.navigate('VehicleList')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 80 }, // extra space for bottom tab bar
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  headerContent: { paddingTop: Spacing.md },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  greeting: { fontSize: Typography.base, color: Colors.white, opacity: 0.9, marginBottom: Spacing.xs },
  userName: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.white },
  subtitle: { fontSize: Typography.base, color: Colors.white, opacity: 0.9, marginTop: Spacing.sm },
  searchContainer: { paddingHorizontal: Spacing.lg, marginTop: -Spacing.md, marginBottom: Spacing.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Shadows.md,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
});

export default ClientHomeScreen;
