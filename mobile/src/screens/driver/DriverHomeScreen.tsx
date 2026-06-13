import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../utils/api';
import JobRequestCard, { JobRequestData } from '../../components/ui/JobRequestCard';
import { DriverColors } from '../../constants/sucarTheme';

const DriverHomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [online, setOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [pendingJob, setPendingJob] = useState<JobRequestData | null>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({ today: 'K0', jobs: '0', rating: '4.8' });

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get('/drivers/bookings');
      const bookings = res.data.data || [];
      const pending = bookings.find((b: any) => b.status === 'pending');
      const active = bookings.filter((b: any) =>
        ['accepted', 'picked_up', 'at_wash', 'washing_bay', 'drying_bay', 'wash_completed'].includes(b.status),
      );

      if (pending) {
        const created = new Date(pending.createdAt || pending.created_at || Date.now());
        const mins = Math.max(1, Math.floor((Date.now() - created.getTime()) / 60000));
        setPendingJob({
          id: pending.id || pending._id,
          clientName: pending.clientId?.name || 'Customer',
          serviceName: pending.serviceId?.name || 'Car wash',
          vehicleInfo: pending.vehicleId
            ? `${pending.vehicleId.make || ''} ${pending.vehicleId.model || ''}`.trim()
            : undefined,
          distanceKm: 0.8,
          earnings: parseFloat(pending.totalAmount) * 0.8 || parseFloat(pending.totalAmount) || 68,
          minutesAgo: mins,
        });
      } else {
        setPendingJob(null);
      }
      setActiveJobs(active.slice(0, 3));

      const today = new Date().toDateString();
      const doneToday = bookings.filter((b: any) => {
        if (!['completed', 'delivered', 'wash_completed'].includes(b.status)) return false;
        const d = new Date(b.updatedAt || b.updated_at || b.createdAt);
        return d.toDateString() === today;
      });
      const earn = doneToday.reduce((s: number, b: any) => s + (parseFloat(b.totalAmount) || 0) * 0.8, 0);
      setStats({
        today: `K${Math.round(earn)}`,
        jobs: String(doneToday.length),
        rating: '4.8',
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
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={DriverColors.primary} />
        }
      >
        <View style={styles.onlineRow}>
          <View style={styles.dot} />
          <Text style={styles.onlineText}>{online ? 'Online — accepting jobs' : 'Offline'}</Text>
          <Switch
            value={online}
            onValueChange={setOnline}
            trackColor={{ false: '#334155', true: DriverColors.primaryDark }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.earnBar}>
          <View style={styles.earnStat}>
            <Text style={styles.earnLbl}>Today</Text>
            <Text style={styles.earnVal}>{stats.today} <Text style={styles.earnSub}>earned</Text></Text>
          </View>
          <View style={styles.earnStat}>
            <Text style={styles.earnLbl}>Jobs done</Text>
            <Text style={styles.earnVal}>{stats.jobs} <Text style={styles.earnSub}>washes</Text></Text>
          </View>
          <View style={styles.earnStat}>
            <Text style={styles.earnLbl}>Rating</Text>
            <Text style={styles.earnVal}>{stats.rating} <Text style={styles.earnSub}>★</Text></Text>
          </View>
        </View>

        {pendingJob && online && (
          <>
            <Text style={styles.sec}>New job alert</Text>
            <JobRequestCard job={pendingJob} loading={accepting} onAccept={handleAccept} onDecline={() => setPendingJob(null)} />
          </>
        )}

        {activeJobs.length > 0 && (
          <>
            <Text style={styles.sec}>In progress</Text>
            {activeJobs.map((j) => (
              <TouchableOpacity
                key={j.id || j._id}
                style={styles.activeCard}
                onPress={() => navigation.navigate('BookingDetail', { bookingId: j.id || j._id })}
              >
                <Text style={styles.activeTitle}>{j.serviceId?.name || 'Active job'}</Text>
                <Text style={styles.activeMeta}>{j.carWashId?.carWashName || j.pickupLocation || ''}</Text>
                <View style={styles.navBtn}>
                  <Ionicons name="navigate" size={14} color={DriverColors.blue} />
                  <Text style={styles.navTxt}>View job</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {!pendingJob && activeJobs.length === 0 && online && (
          <Text style={styles.empty}>No jobs right now. Pull to refresh.</Text>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DriverColors.background },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'rgba(61,214,140,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: DriverColors.border,
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DriverColors.primary },
  onlineText: { flex: 1, fontSize: 12, fontWeight: '600', color: DriverColors.primary },
  earnBar: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: DriverColors.border, gap: 12 },
  earnStat: { flex: 1 },
  earnLbl: { fontSize: 9, color: DriverColors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  earnVal: { fontSize: 18, fontWeight: '700', color: DriverColors.text, marginTop: 3 },
  earnSub: { fontSize: 11, fontWeight: '400', color: DriverColors.textSecondary },
  sec: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    fontSize: 10,
    fontWeight: '600',
    color: DriverColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  activeCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: DriverColors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DriverColors.border,
    padding: 12,
  },
  activeTitle: { fontSize: 12, fontWeight: '600', color: DriverColors.text },
  activeMeta: { fontSize: 10, color: DriverColors.textSecondary, marginTop: 4 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  navTxt: { fontSize: 11, fontWeight: '600', color: DriverColors.blue },
  empty: { textAlign: 'center', color: DriverColors.textMuted, margin: 24, fontSize: 13 },
});

export default DriverHomeScreen;
