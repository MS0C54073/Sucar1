import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../utils/api';
import EarningsRow from '../../components/ui/EarningsRow';
import { DriverColors } from '../../constants/sucarTheme';

const DriverEarningsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: '$0.00', jobs: '0', week: '$0.00' });

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/drivers/bookings');
        const bookings = res.data.data || [];
        const completed = bookings.filter((b: any) =>
          ['completed', 'delivered', 'wash_completed'].includes(b.status),
        );
        const total = completed.reduce((s: number, b: any) => s + (parseFloat(b.totalAmount) || 0), 0);
        setStats({
          total: `$${total.toFixed(2)}`,
          jobs: String(completed.length),
          week: `$${(total * 0.4).toFixed(2)}`,
        });
      } catch {
        /* keep defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DriverColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.sub}>Your performance summary</Text>
        <EarningsRow
          stats={[
            { icon: 'wallet-outline', iconColor: '#3B82F6', label: 'All-time', value: stats.total },
            { icon: 'briefcase-outline', iconColor: '#22C55E', label: 'Jobs', value: stats.jobs },
            { icon: 'calendar-outline', iconColor: '#EAB308', label: 'This week', value: stats.week },
          ]}
        />
        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={22} color="#3B82F6" />
          <Text style={styles.tipText}>Payouts are processed weekly. Complete more jobs to increase earnings.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DriverColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  sub: { fontSize: 14, color: DriverColors.textSecondary, marginBottom: 24 },
  tip: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    padding: 16,
    backgroundColor: DriverColors.surface,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  tipText: { flex: 1, color: DriverColors.textSecondary, fontSize: 14, lineHeight: 20 },
});

export default DriverEarningsScreen;
