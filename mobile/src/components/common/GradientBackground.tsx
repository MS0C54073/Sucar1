import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface GradientBackgroundProps {
  children: React.ReactNode;
  colors?: string[];
  style?: ViewStyle;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  colors = [Colors.gradientStart, Colors.gradientEnd],
  style,
}) => {
    const { theme } = useTheme();
    const gStart = theme.colors.gradientStart || theme.colors.headerGradientStart || Colors.gradientStart;
    const gEnd = theme.colors.gradientEnd || theme.colors.headerGradientEnd || Colors.gradientEnd;

    return (
      <LinearGradient
        colors={[gStart, gEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, style]}
      >
        {children}
      </LinearGradient>
    );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export default GradientBackground;
