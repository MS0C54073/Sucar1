import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconColor,
  backgroundColor,
  style,
}) => {
  const { theme } = useTheme();
  const cardBg = backgroundColor || theme?.colors?.surface || Colors.surface;
  const iconCol = iconColor || theme?.colors?.primary || Colors.primary;

  return (
    <Animatable.View animation="zoomIn" duration={600} useNativeDriver>
      <View style={[styles.card, { backgroundColor: cardBg }, Shadows.md, style]}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${iconCol}15` }]}>
            <Ionicons name={icon} size={24} color={iconCol} />
          </View>
        )}
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    flex: 1,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default StatCard;
