import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows } from '../../constants/theme';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled = false,
}) => {
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 28 : 22;
  const padding = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: Colors.gray200,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: Colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return Colors.textInverse;
      case 'secondary':
        return Colors.textPrimary;
      case 'outline':
        return Colors.primary;
      case 'ghost':
        return Colors.primary;
      default:
        return Colors.textInverse;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        {
          padding,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={iconSize} color={getTextColor()} />
      {label && (
        <Text style={[styles.label, { color: getTextColor(), fontSize: size === 'sm' ? Typography.sm : Typography.base }, textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  label: {
    fontWeight: Typography.semibold,
    marginLeft: 8,
  },
});

export default IconButton;
