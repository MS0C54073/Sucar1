import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { AuthThemePalette } from '../../constants/sucarTheme';

interface AuthThemeToggleProps {
  colors: AuthThemePalette;
  style?: object;
}

/** Sun = switch to light; moon = switch to dark (per mockup). */
const AuthThemeToggle = ({ colors, style }: AuthThemeToggleProps) => {
  const { appearance, toggle } = useTheme();
  const isDark = appearance === 'dark';

  return (
    <TouchableOpacity
      onPress={toggle}
      style={[styles.btn, { backgroundColor: colors.toggleBg }, style]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <Ionicons
        name={isDark ? 'sunny' : 'moon'}
        size={22}
        color={isDark ? '#FBBF24' : '#6366F1'}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AuthThemeToggle;
