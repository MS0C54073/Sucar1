import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Switch,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../utils/api';
import JobRequestCard, { JobRequestData } from '../../components/ui/JobRequestCard';
import EarningsRow from '../../components/ui/EarningsRow';
import SuCarLogo from '../../components/brand/SuCarLogo';
import { DriverColors, BrandGradients, AppLayout } from '../../constants/sucarTheme';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';

const DriverHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const unreadCount = useUnreadNotifications();
  const [online, setOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [pendingJob, setPendingJob] = useState<JobRequestData | null>(null);
  const [stats, setStats] = useState({ total: 'K0', jobs: '0', time: '0h 0m' });

  const firstName = user?.name?.split(' ')[0] || 'Driver';
  const C = DriverColors;
  const insets = useSafeAreaInsets();

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get('/drivers/bookings');
      const bookings = res.data.data || [];
      const pending = bookings.find((b: any) => b.status === 'pending');

      if (pending) {
        const created = new Date(pending.createdAt || pending.created_at || Date.now());
        const mins = Math.max(1, Math.floor((Date.now() - created.getTime()) / 60000));
        setPendingJob({
          id: pending.id || pending._id,
          clientName: pending.clientId?.name || 'Customer',
          serviceName: pending.serviceId?.name || 'Exterior Wash',
          vehicleInfo: pending.vehicleId
            ? `${pending.vehicleId.make || ''} ${pending.vehicleId.model || ''}`.trim()
            : undefined,
          distanceKm: 3.2,
          earnings: (parseFloat(pending.totalAmount) || 0) * 0.8 || 28.5,
          minutesAgo: mins,
        });
      } else {
        setPendingJob(null);
      }

      const today = new Date().toDateString();
      const doneToday = bookings.filter((b: any) => {
        if (!['completed', 'delivered', 'wash_completed'].includes(b.status)) return false;
        const d = new Date(b.updatedAt || b.updated_at || b.createdAt);
        return d.toDateString() === today;
      });
      const earn = doneToday.reduce((s: number, b: any) => s + (parseFloat(b.totalAmount) || 0) * 0.8, 0);
      setStats({
        total: `K${earn.toFixed(2)}`,
        jobs: String(doneToday.length),
        time: '5h 45m',
      });
    } catch (e) {
      console.error('Driver home:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async () => {
    if (!pendingJob) return;
    setAccepting(true);
    try {
      const res = await apiClient.put(`/drivers/bookings/${pendingJob.id}/accept`);
      if (res.data.success) {
        Alert.alert('Accepted', 'Job added to your queue.');
        fetchData();
        navigation.navigate('JobsTab');
      } else {
        Alert.alert('Error', res.data.message || 'Could not accept');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to accept');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
            tintColor={C.primary}
          />
        }
      >
        <LinearGradient
          colors={[...BrandGradients.headerDriver]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              hitSlop={12}
              style={styles.iconBtn}
            >
              <Ionicons name="menu" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <SuCarLogo size={22} suffix=" Driver" />
            <TouchableOpacity hitSlop={12} style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.profileRow}>
            <LinearGradient
              colors={[...BrandGradients.avatarDriver]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Ionicons name="car-sport" size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.profileText}>
              <Text style={styles.hello}>Hello, {firstName}!</Text>
              <Text style={styles.tagline}>Ready for jobs in Lusaka</Text>
            </View>
            <View style={styles.onlineWrap}>
              <Text style={[styles.onlineLbl, online && styles.onlineOn]}>
                {online ? 'Online' : 'Offline'}
              </Text>
              <Switch
                value={online}
                onValueChange={setOnline}
                trackColor={{ false: 'rgba(255,255,255,0.25)', true: '#86EFAC' }}
                thumbColor={online ? '#16A34A' : '#F1F5F9'}
              />
            </View>
          </View>
          {online && (
            <Text style={styles.avail}>You're available for new job requests</Text>
          )}
        </LinearGradient>

        {pendingJob && online && (
          <View style={styles.jobSection}>
            <View style={styles.secHead}>
              <Text style={styles.secTitle}>New request</Text>
            </View>
            <JobRequestCard
              job={pendingJob}
              loading={accepting}
              onAccept={handleAccept}
              onDecline={() => setPendingJob(null)}
            />
          </View>
        )}

        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Today's earnings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EarningsTab')}>
            <Text style={styles.secLink}>View summary</Text>
          </TouchableOpacity>
        </View>
        <EarningsRow
          variant="driver"
          stats={[
            { icon: 'wallet-outline', iconColor: C.primary, label: 'Total', value: stats.total },
            { icon: 'briefcase-outline', iconColor: C.success, label: 'Jobs', value: stats.jobs },
            { icon: 'time-outline', iconColor: C.accent, label: 'Online', value: stats.time },
          ]}
        />

        <TouchableOpacity style={styles.achievement} activeOpacity={0.85}>
          <View style={[styles.starCircle, { backgroundColor: C.primary }]}>
            <Ionicons name="star" size={16} color="#FFF" />
          </View>
          <Text style={styles.achieveText}>
            Keep up the great work! You're in the top 20% of detailers today.
          </Text>
          <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DriverColors.background },
  hero: {
    paddingHorizontal: AppLayout.screenPadding,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  iconBtn: { padding: 4, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: DriverColors.accent,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: AppLayout.heroAvatarSize,
    height: AppLayout.heroAvatarSize,
    borderRadius: AppLayout.heroAvatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1 },
  hello: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  tagline: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  onlineWrap: { alignItems: 'flex-end' },
  onlineLbl: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: '600' },
  onlineOn: { color: '#BBF7D0' },
  avail: {
    fontSize: 12,
    color: '#DDD6FE',
    marginTop: 12,
    fontWeight: '500',
  },
  jobSection: { marginTop: 8 },
  secHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppLayout.screenPadding,
    paddingTop: 16,
    paddingBottom: 8,
  },
  secTitle: { fontSize: AppLayout.sectionTitleSize, fontWeight: '700', color: DriverColors.text },
  secLink: { fontSize: 13, fontWeight: '600', color: DriverColors.primary },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: AppLayout.screenPadding,
    marginTop: 14,
    padding: 14,
    backgroundColor: DriverColors.surface,
    borderRadius: AppLayout.cardRadius,
    borderWidth: 1,
    borderColor: DriverColors.border,
    gap: 10,
  },
  starCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveText: { flex: 1, fontSize: 12, color: DriverColors.textSecondary, lineHeight: 17 },
});

export default DriverHomeScreen;
