import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ClientColors, DriverColors } from '../constants/sucarTheme';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

type DashboardData = {
  isAffiliate: boolean;
  referralCode: string | null;
  referralLink: string | null;
  stats: {
    totalReferrals: number;
    signedUp: number;
    firstBooking: number;
    completedBookings: number;
    totalEarned: number;
    availableBalance: number;
  };
  milestones: { count: number; label: string; tier: number; reached: boolean }[];
  minCashout: number;
  rewardPerReferral: number;
};

const ReferralDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const isDriver = user?.role === 'driver';
  const C = isDriver ? DriverColors : ClientColors;

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiClient.get('/referrals/dashboard');
      setDashboard(res.data.data);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not load referral dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const joinProgram = async () => {
    setJoining(true);
    try {
      await apiClient.post('/referrals/join');
      Alert.alert('Welcome!', 'You are now a SuCAR referrer.');
      await fetchDashboard();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not join program');
    } finally {
      setJoining(false);
    }
  };

  const requestCashout = async () => {
    setCashingOut(true);
    try {
      const res = await apiClient.post('/referrals/cashout');
      Alert.alert('Cashout requested', res.data.message || 'We will process your request soon.');
      await fetchDashboard();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Cashout failed');
    } finally {
      setCashingOut(false);
    }
  };

  const shareLink = async () => {
    if (!dashboard?.referralLink) return;
    try {
      await Share.share({
        message: `Join SuCAR and get your car washed on demand! Use my code ${dashboard.referralCode}: ${dashboard.referralLink}`,
      });
    } catch {
      Alert.alert('Share', dashboard.referralLink);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard?.isAffiliate) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <ScrollView contentContainerStyle={styles.joinContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
            <Text style={[styles.backText, { color: C.text }]}>Back</Text>
          </TouchableOpacity>
          <View style={[styles.joinCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={[styles.joinBadge, { backgroundColor: `${C.primary}18` }]}>
              <Ionicons name="people-outline" size={18} color={C.primary} />
              <Text style={[styles.joinBadgeText, { color: C.primary }]}>SuCAR Referral Program</Text>
            </View>
            <Text style={[styles.joinTitle, { color: C.text }]}>Earn while you share SuCAR</Text>
            <Text style={[styles.joinSub, { color: C.textSecondary }]}>
              Refer friends who book a car wash. Earn K{dashboard?.rewardPerReferral ?? 25} per successful referral.
            </Text>
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: isDriver ? C.primary : C.accent }]}
              onPress={joinProgram}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.joinBtnText}>Become a SuCAR Referrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const stats = dashboard.stats;
  const statCards = [
    { label: 'Total referrals', value: stats.totalReferrals, icon: 'people-outline' as const },
    { label: 'Signed up', value: stats.signedUp, icon: 'person-add-outline' as const },
    { label: 'First wash booked', value: stats.firstBooking, icon: 'calendar-outline' as const },
    { label: 'Successful', value: stats.completedBookings, icon: 'checkmark-circle-outline' as const },
    { label: 'Total earned', value: `K${stats.totalEarned}`, icon: 'cash-outline' as const },
    { label: 'Balance', value: `K${stats.availableBalance}`, icon: 'wallet-outline' as const },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} tintColor={C.primary} />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: C.text }]}>Referral Dashboard</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              Track referrals and get rewarded
            </Text>
          </View>
          <TouchableOpacity style={[styles.linkBtn, { borderColor: C.border }]} onPress={shareLink}>
            <Ionicons name="link-outline" size={18} color={C.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {statCards.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Ionicons name={s.icon} size={20} color={C.primary} />
              <Text style={[styles.statValue, { color: C.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Milestones</Text>
          <View style={styles.milestoneRow}>
            {dashboard.milestones.map((m) => (
              <View key={m.tier} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneBadge,
                    m.reached
                      ? { backgroundColor: C.primary }
                      : { backgroundColor: C.border },
                  ]}
                >
                  <Text style={[styles.milestoneCount, { color: m.reached ? '#FFF' : C.textMuted }]}>
                    {m.count}
                  </Text>
                </View>
                <Text style={[styles.milestoneLabel, { color: C.textSecondary }]} numberOfLines={2}>
                  {m.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.codeCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.codeLabel, { color: C.textSecondary }]}>Your referral code</Text>
          <Text style={[styles.codeValue, { color: C.primary }]}>{dashboard.referralCode}</Text>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: isDriver ? C.primary : C.accent }]}
            onPress={shareLink}
          >
            <Ionicons name="share-social-outline" size={18} color="#FFF" />
            <Text style={styles.shareBtnText}>Share referral link</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.cashoutBtn,
            {
              backgroundColor: C.primary,
              opacity: stats.availableBalance >= (dashboard.minCashout || 100) ? 1 : 0.5,
            },
          ]}
          disabled={
            cashingOut ||
            stats.availableBalance < (dashboard.minCashout || 100)
          }
          onPress={requestCashout}
        >
          {cashingOut ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.cashoutText}>
              Cash out (min K{dashboard.minCashout || 100})
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl },
  joinContent: { padding: Spacing.lg, flexGrow: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md },
  backText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.lg },
  headerText: { flex: 1 },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold },
  subtitle: { fontSize: Typography.sm, marginTop: 2 },
  linkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 4,
  },
  statValue: { fontSize: Typography.lg, fontWeight: Typography.bold },
  statLabel: { fontSize: Typography.xs },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.bold, marginBottom: Spacing.md },
  milestoneRow: { flexDirection: 'row', justifyContent: 'space-between' },
  milestoneItem: { alignItems: 'center', flex: 1 },
  milestoneBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  milestoneCount: { fontSize: Typography.sm, fontWeight: Typography.bold },
  milestoneLabel: { fontSize: 10, textAlign: 'center', fontWeight: Typography.semibold },
  codeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  codeLabel: { fontSize: Typography.sm },
  codeValue: { fontSize: Typography['2xl'], fontWeight: Typography.bold, letterSpacing: 2, marginVertical: Spacing.sm },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  shareBtnText: { color: '#FFF', fontWeight: Typography.bold },
  cashoutBtn: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cashoutText: { color: '#FFF', fontWeight: Typography.bold },
  joinCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  joinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  joinBadgeText: { fontSize: Typography.sm, fontWeight: Typography.bold },
  joinTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, textAlign: 'center', marginBottom: Spacing.sm },
  joinSub: { fontSize: Typography.sm, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg },
  joinBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  joinBtnText: { color: '#FFF', fontWeight: Typography.bold, fontSize: Typography.base },
});

export default ReferralDashboardScreen;
