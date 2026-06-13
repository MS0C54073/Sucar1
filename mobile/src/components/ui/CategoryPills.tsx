import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClientColors, CATEGORIES, AppLayout } from '../../constants/sucarTheme';

interface CategoryPillsProps {
  selected: string;
  onSelect: (id: string) => void;
}

const CategoryPills = ({ selected, onSelect }: CategoryPillsProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    {CATEGORIES.map((c) => {
      const on = selected === c.id;
      return (
        <TouchableOpacity key={c.id} style={styles.cat} onPress={() => onSelect(c.id)} activeOpacity={0.8}>
          <View style={[styles.ic, on && styles.icOn]}>
            <Ionicons name={c.icon} size={22} color={on ? ClientColors.primary : ClientColors.textSecondary} />
          </View>
          <Text style={[styles.lbl, on && styles.lblOn]}>{c.label}</Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  row: { paddingHorizontal: AppLayout.screenPadding, gap: 10, paddingBottom: 4 },
  cat: { alignItems: 'center', width: 64 },
  ic: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: ClientColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  icOn: { backgroundColor: ClientColors.greenLight, borderColor: ClientColors.primaryLight },
  lbl: { fontSize: 9, fontWeight: '500', color: ClientColors.textSecondary },
  lblOn: { color: ClientColors.primaryDark, fontWeight: '600' },
});

export default CategoryPills;
