import React from 'react';

import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { DriverColors, AppLayout } from '../../constants/sucarTheme';



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



const C = DriverColors;



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

            <Ionicons name="person" size={20} color={C.primary} />

          </View>

          <View>

            <Text style={styles.clientName}>{job.clientName || 'Customer'}</Text>

            <Text style={styles.residential}>Residential</Text>

          </View>

        </View>

        <View style={styles.detailRow}>

          <Ionicons name="car-outline" size={16} color={C.textSecondary} />

          <Text style={styles.detailText}>{job.serviceName || 'Car wash'}</Text>

        </View>

        {job.vehicleInfo ? <Text style={styles.subDetail}>{job.vehicleInfo}</Text> : null}

        <View style={styles.detailRow}>

          <Ionicons name="location-outline" size={16} color={C.textSecondary} />

          <Text style={styles.detailText}>

            {job.distanceKm != null ? `${job.distanceKm.toFixed(1)} km away` : 'Nearby'}

          </Text>

        </View>

      </View>

      <View style={styles.mapBox}>

        <Ionicons name="map" size={28} color={C.primary} />

      </View>

    </View>



    <Text style={styles.earnLabel}>Est. earnings</Text>

    <Text style={styles.earnValue}>

      K{job.earnings != null ? job.earnings.toFixed(2) : '—'}

    </Text>



    <View style={styles.actions}>

      <TouchableOpacity style={styles.declineBtn} onPress={onDecline} disabled={loading}>

        <Text style={styles.declineText}>Decline</Text>

      </TouchableOpacity>

      <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} disabled={loading}>

        {loading ? (

          <ActivityIndicator color="#FFF" />

        ) : (

          <Text style={styles.acceptText}>Accept</Text>

        )}

      </TouchableOpacity>

    </View>

  </View>

);



const styles = StyleSheet.create({

  card: {

    marginHorizontal: AppLayout.screenPadding,

    marginBottom: 12,

    backgroundColor: C.surface,

    borderRadius: AppLayout.cardRadius,

    padding: 16,

    borderWidth: 1,

    borderColor: C.border,

  },

  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },

  label: { fontSize: 11, fontWeight: '700', color: C.primary, letterSpacing: 0.6 },

  timeBadge: {

    backgroundColor: C.greenLight,

    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: 10,

  },

  timeText: { fontSize: 10, color: C.textSecondary },

  body: { flexDirection: 'row', gap: 10 },

  info: { flex: 1 },

  clientRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  avatar: {

    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: C.greenLight,

    alignItems: 'center',

    justifyContent: 'center',

  },

  clientName: { fontSize: 15, fontWeight: '700', color: C.text },

  residential: { fontSize: 11, color: C.textMuted },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },

  detailText: { fontSize: 13, color: C.textSecondary },

  subDetail: { fontSize: 11, color: C.textMuted, marginLeft: 22 },

  mapBox: {

    width: 90,

    height: 90,

    borderRadius: 12,

    backgroundColor: C.greenLight,

    alignItems: 'center',

    justifyContent: 'center',

  },

  earnLabel: { fontSize: 12, color: C.textSecondary, marginTop: 12 },

  earnValue: { fontSize: 26, fontWeight: '800', color: C.success, marginBottom: 12 },

  actions: { flexDirection: 'row', gap: 10 },

  declineBtn: {

    flex: 1,

    paddingVertical: 14,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: C.border,

    alignItems: 'center',

  },

  declineText: { color: C.text, fontWeight: '700', fontSize: 13 },

  acceptBtn: {

    flex: 1,

    paddingVertical: 14,

    borderRadius: 12,

    backgroundColor: C.primary,

    alignItems: 'center',

  },

  acceptText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

});



export default JobRequestCard;

