import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DriverColors, AppLayout } from '../../constants/sucarTheme';

const C = DriverColors;

const DriverRatingsScreen = () => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.content}>
      <View style={styles.scoreCircle}>
        <Text style={styles.score}>4.9</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Ionicons key={i} name="star" size={18} color="#FBBF24" />
          ))}
        </View>
      </View>
      <Text style={styles.title}>Your rating</Text>
      <Text style={styles.sub}>Based on customer feedback after completed jobs</Text>
      <View style={styles.stat}>
        <Text style={styles.statVal}>128</Text>
        <Text style={styles.statLabel}>Total reviews</Text>
      </View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  score: { fontSize: 36, fontWeight: '800', color: C.text },
  stars: { flexDirection: 'row', marginTop: 4 },
  title: { fontSize: 22, fontWeight: '700', color: C.text },
  sub: { fontSize: 14, color: C.textSecondary, textAlign: 'center', marginTop: 8 },
  stat: { marginTop: 32, alignItems: 'center' },
  statVal: { fontSize: 28, fontWeight: '800', color: C.primary },
  statLabel: { fontSize: 13, color: C.textMuted, marginTop: 4 },
});

export default DriverRatingsScreen;
