import React from 'react';
import { Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { ClientColors } from '../../constants/sucarTheme';

interface SuCarLogoProps {
  size?: number;
  suColor?: string;
  carColor?: string;
  style?: ViewStyle;
  suffix?: string;
}

/** Split wordmark: "Su" + accent "CAR" — matches reference mockup */
const SuCarLogo = ({
  size = 22,
  suColor = '#FFFFFF',
  carColor = ClientColors.accent,
  style,
  suffix = '',
}: SuCarLogoProps) => (
  <Text style={[styles.base, { fontSize: size }, style]}>
    <Text style={{ color: suColor, fontWeight: '800' }}>Su</Text>
    <Text style={{ color: carColor, fontWeight: '800' }}>CAR{suffix}</Text>
  </Text>
);

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0.4,
  } as TextStyle,
});

export default SuCarLogo;
