import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Alert,
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
 * Shows booking and vehicle statistics, exposes quick actions
 * (new booking, bookings list, vehicles), and shortcuts to
 * other features like favorites, notifications, help, and profile.
 */
const ClientHomeScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
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
      // Fetch bookings
      const bookingsResponse = await apiClient.get('/bookings');
      const bookings = bookingsResponse.data.data || [];
      
      // Fetch vehicles
      const vehiclesResponse = await apiClient.get('/vehicles');
      const vehicles = vehiclesResponse.data.data || [];

      const activeBookings = bookings.filter(
        (b: any) => !['completed', 'cancelled', 'delivered'].includes(b.status)
      );
      const completedBookings = bookings.filter(
        (b: any) => ['completed', 'delivered'].includes(b.status)
      );

      setStats({
        totalBookings: bookings.length,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
        totalVehicles: vehicles.length,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      // Don't show alert on home screen, just log
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
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
                <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>{user?.name?.split(' ')[0] || 'User'}</Text>
              </View>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={24} color={theme.colors.white || '#fff'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.subtitle, { color: theme.colors.textPrimary }]}>Let's get your car sparkling clean!</Text>
          </Animatable.View>
        </GradientBackground>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon="calendar-outline"
            iconColor={Colors.primary}
          />
          <StatCard
            title="Active"
            value={stats.activeBookings}
            icon="time-outline"
            iconColor={Colors.info}
          />
          <StatCard
            title="Completed"
            value={stats.completedBookings}
            icon="checkmark-circle-outline"
            iconColor={Colors.success}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ActionCard
            title="New Booking"
            description="Book a car wash pickup service"
            icon="add-circle-outline"
            iconColor={Colors.primary}
            onPress={() => navigation.navigate('Booking' as never)}
          />
          <ActionCard
            title="My Bookings"
            description="View and manage all your bookings"
            icon="list-outline"
            iconColor={Colors.info}
            badge={stats.activeBookings > 0 ? stats.activeBookings : undefined}
            onPress={() => navigation.navigate('MyBookings' as never)}
          />
          <ActionCard
            title="My Vehicles"
            description={`Manage your ${stats.totalVehicles} vehicle${stats.totalVehicles !== 1 ? 's' : ''}`}
            icon="car-outline"
            iconColor={Colors.success}
            badge={stats.totalVehicles > 0 ? stats.totalVehicles : undefined}
            onPress={() => navigation.navigate('VehicleList' as never)}
          />
        </View>

        {/* Additional Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.featureGrid}>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('MyBookings' as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: `${Colors.warning}15` }]}>
                <Ionicons name="star-outline" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.featureText}>Favorites</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('MyBookings' as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: `${Colors.error}15` }]}>
                <Ionicons name="notifications-outline" size={24} color={Colors.error} />
              </View>
              <Text style={styles.featureText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('MyBookings' as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: `${Colors.info}15` }]}>
                <Ionicons name="help-circle-outline" size={24} color={Colors.info} />
              </View>
              <Text style={styles.featureText}>Help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate('Profile' as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                <Ionicons name="person-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  headerContent: {
    paddingTop: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.base,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  logoutButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.white,
    opacity: 0.9,
    marginTop: Spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    // Slight overlap with header for the card effect — reduced for better alignment
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureCard: {
    width: '47%',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  featureText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});

export default ClientHomeScreen;
