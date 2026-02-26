import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface ActionCardProps {
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress: () => void;
  style?: ViewStyle;
  badge?: string | number;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  iconColor,
  onPress,
  style,
  badge,
}) => {
  const { theme } = useTheme();
  const iconCol = iconColor || theme.colors.primary || '#667eea';

  return (
    <Animatable.View animation="fadeInUp" duration={600} useNativeDriver>
      <TouchableOpacity
        style={[styles.card, Shadows.md, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconCol}15` }]}>
            <Ionicons name={icon} size={28} color={iconCol} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              {badge !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              )}
            </View>
            {description && (
              <Text style={styles.description}>{description}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400 || '#9ca3af'} />
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  description: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.base * Typography.lineHeight.normal,
  },
});

export default ActionCard;
