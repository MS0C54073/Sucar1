import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface JobRequestData {
  id: string;
  clientName?: string;
  serviceName?: string;
  vehicleInfo?: string;
  distanceKm?: number;
  earnings?: number;
  minutesAgo?: number;
}

interface JobRequestCardProps {
  job: JobRequestData;
  loading?: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const JobRequestCard = ({ job, loading, onAccept, onDecline }: JobRequestCardProps) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.label}>NEW JOB REQUEST</Text>
      {job.minutesAgo != null && (
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{job.minutesAgo} min ago</Text>
        </View>
      )}
    </View>

    <View style={styles.body}>
      <View style={styles.info}>
        <View style={styles.clientRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.clientName}>{job.clientName || 'Customer'}</Text>
            <Text style={styles.residential}>Residential</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={18} color="#94A3B8" />
          <Text style={styles.detailText}>{job.serviceName || 'Car wash service'}</Text>
        </View>
        {job.vehicleInfo ? (
          <Text style={styles.subDetail}>{job.vehicleInfo}</Text>
        ) : null}
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={18} color="#94A3B8" />
          <Text style={styles.detailText}>
            {job.distanceKm != null ? `${job.distanceKm.toFixed(1)} km away` : 'Nearby pickup'}
          </Text>
        </View>
        <Text style={styles.fromLoc}>from your location</Text>
      </View>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={32} color="#3B82F6" />
        <View style={styles.routeDot} />
        <View style={styles.routeEnd} />
      </View>
    </View>

    <View style={styles.earningsRow}>
      <View>
        <Text style={styles.earnLabel}>Est. Earnings</Text>
        <Text style={styles.earnValue}>
          ${job.earnings != null ? job.earnings.toFixed(2) : '—'}
        </Text>
      </View>
    </View>

    <View style={styles.actions}>
      <TouchableOpacity style={styles.declineBtn} onPress={onDecline} disabled={loading}>
        <Text style={styles.declineText}>DECLINE</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.acceptText}>ACCEPT</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: '#262C36',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3548',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: '#3DD68C', letterSpacing: 0.8 },
  timeBadge: { backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timeText: { fontSize: 11, color: '#94A3B8' },
  body: { flexDirection: 'row', gap: 12 },
  info: { flex: 1 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  residential: { fontSize: 12, color: '#64748B', marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  detailText: { fontSize: 14, color: '#E2E8F0', flex: 1 },
  subDetail: { fontSize: 12, color: '#94A3B8', marginLeft: 26, marginTop: 2 },
  fromLoc: { fontSize: 12, color: '#64748B', marginLeft: 26, marginTop: 2 },
  mapPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDot: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  routeEnd: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  earningsRow: { marginTop: 16, marginBottom: 12 },
  earnLabel: { fontSize: 12, color: '#94A3B8' },
  earnValue: { fontSize: 28, fontWeight: '800', color: '#22C55E', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
  },
  declineText: { color: '#E2E8F0', fontWeight: '700', fontSize: 14 },
  acceptBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3DD68C',
    alignItems: 'center',
  },
  acceptText: { color: '#0A1A12', fontWeight: '700', fontSize: 14 },
});

export default JobRequestCard;
