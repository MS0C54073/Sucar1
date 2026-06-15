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
            <Ionicons
              name={c.icon}
              size={22}
              color={on ? ClientColors.accent : ClientColors.textSecondary}
            />
          </View>
          <Text style={[styles.lbl, on && styles.lblOn]}>{c.label}</Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  row: { paddingHorizontal: AppLayout.screenPadding, gap: 12, paddingBottom: 8 },
  cat: { alignItems: 'center', width: 68 },
  ic: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: ClientColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  icOn: {
    backgroundColor: ClientColors.accentLight,
    borderColor: ClientColors.accent,
  },
  lbl: { fontSize: 11, fontWeight: '500', color: ClientColors.textSecondary },
  lblOn: { color: ClientColors.accent, fontWeight: '700' },
});

export default CategoryPills;
