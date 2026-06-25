import React from 'react';

import { View, Text, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { ClientColors, DriverColors, AppLayout } from '../../constants/sucarTheme';



interface StatItem {

  icon: keyof typeof Ionicons.glyphMap;

  iconColor: string;

  label: string;

  value: string;

}



interface EarningsRowProps {

  stats: StatItem[];

  variant?: 'client' | 'driver';

}



const EarningsRow = ({ stats, variant = 'client' }: EarningsRowProps) => {

  const C = variant === 'driver' ? DriverColors : ClientColors;

  return (

    <View style={[styles.row, { backgroundColor: C.surface, borderColor: C.border }]}>

      {stats.map((s, i) => (

        <View

          key={i}

          style={[styles.stat, i < stats.length - 1 && { borderRightColor: C.border, borderRightWidth: 1 }]}

        >

          <Ionicons name={s.icon} size={22} color={s.iconColor} />

          <Text style={[styles.value, { color: C.text }]}>{s.value}</Text>

          <Text style={[styles.label, { color: C.textSecondary }]}>{s.label}</Text>

        </View>

      ))}

    </View>

  );

};



const styles = StyleSheet.create({

  row: {

    flexDirection: 'row',

    marginHorizontal: AppLayout.screenPadding,

    borderRadius: AppLayout.cardRadius,

    borderWidth: 1,

    overflow: 'hidden',

  },

  stat: { flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },

  value: { fontSize: 18, fontWeight: '800', marginTop: 8 },

  label: { fontSize: 11, marginTop: 4, textAlign: 'center' },

});



export default EarningsRow;

