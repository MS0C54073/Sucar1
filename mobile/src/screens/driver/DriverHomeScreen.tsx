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
 * Main home/dashboard screen for driver users.
 *
 * Fetches and displays booking statistics for the logged‑in driver,
 * and provides quick navigation into the driver bookings list.
 */
const DriverHomeScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/drivers/bookings');
      const bookings = response.data.data || [];

      const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
      const activeBookings = bookings.filter(
        (b: any) => ['accepted', 'picked_up', 'at_wash', 'washing_bay', 'drying_bay'].includes(b.status)
      );
      const completedBookings = bookings.filter(
        (b: any) => ['completed', 'delivered', 'wash_completed'].includes(b.status)
      );

      setStats({
        totalBookings: bookings.length,
        pendingBookings: pendingBookings.length,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
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
                <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>{user?.name?.split(' ')[0] || 'Driver'}</Text>
              </View>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={24} color={theme.colors.white || '#fff'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.subtitle, { color: theme.colors.textPrimary }]}>Manage your bookings and deliveries</Text>
          </Animatable.View>
        </GradientBackground>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total"
            value={stats.totalBookings}
            icon="list-outline"
            iconColor={Colors.primary}
          />
          <StatCard
            title="Pending"
            value={stats.pendingBookings}
            icon="time-outline"
            iconColor={Colors.warning}
          />
          <StatCard
            title="Active"
            value={stats.activeBookings}
            icon="car-outline"
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
            title="My Bookings"
            description={`View and manage ${stats.totalBookings} booking${stats.totalBookings !== 1 ? 's' : ''}`}
            icon="list-outline"
            iconColor={Colors.primary}
            badge={stats.pendingBookings > 0 ? stats.pendingBookings : undefined}
            onPress={() => navigation.navigate('DriverBookings' as never)}
          />
        </View>

        {/* Driver Info */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{user.name}</Text>
                </View>
              </View>
              {user.email && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                  </View>
                </View>
              )}
              {user.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{user.phone}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
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
  infoCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
});

export default DriverHomeScreen;
