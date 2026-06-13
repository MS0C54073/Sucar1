import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
      const label = role === 'client' ? '👤 Client' : '🚗 Driver';
      return (
        <TouchableOpacity
          key={role}
          style={[styles.pill, active && { backgroundColor: colors.primary }]}
          onPress={() => onChange(role)}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.pillText,
              { color: colors.textMuted },
              active && { color: colors.roleActiveText, fontWeight: '700' },
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
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  pillText: { fontSize: 14, fontWeight: '600' },
});

export default AuthRolePills;
