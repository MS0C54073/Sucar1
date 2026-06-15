import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AuthThemePalette } from '../../constants/sucarTheme';

export type SignInRole = 'client' | 'driver';

interface AuthRolePillsProps {
  colors: AuthThemePalette;
  value: SignInRole;
  onChange: (role: SignInRole) => void;
}

const AuthRolePills = ({ colors, value, onChange }: AuthRolePillsProps) => (
  <View style={[styles.row, { backgroundColor: colors.roleTrack }]}>
    {(['client', 'driver'] as SignInRole[]).map((role) => {
      const active = value === role;
      const label = role === 'client' ? 'Client' : 'Driver';
      const icon = role === 'client' ? 'person' : 'car-sport';
      const textColor = active ? colors.roleActiveText : colors.textMuted;
      return (
        <TouchableOpacity
          key={role}
          style={[styles.pill, active && { backgroundColor: colors.primary }]}
          onPress={() => onChange(role)}
          activeOpacity={0.85}
        >
          <Ionicons name={icon as any} size={16} color={textColor} />
          <Text
            style={[
              styles.pillText,
              { color: textColor },
              active && { fontWeight: '700' },
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 14, fontWeight: '600' },
});

export default AuthRolePills;
