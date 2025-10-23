import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';

export interface BaseCardProps {
  /** Card content */
  children: ReactNode;
  /** Press handler for interactive cards */
  onPress?: () => void;
  /** Shadow variant */
  shadow?: 'none' | 'small' | 'medium' | 'large';
  /** Padding variant */
  padding?: 'none' | 'small' | 'medium' | 'large';
  /** Border radius variant */
  radius?: 'small' | 'medium' | 'large';
  /** Custom styles */
  style?: ViewStyle;
  /** Accessible label */
  accessibilityLabel?: string;
}

export function BaseCard({
  children,
  onPress,
  shadow = 'small',
  padding = 'medium',
  radius = 'medium',
  style,
  accessibilityLabel,
}: BaseCardProps) {
  const shadowStyles = {
    none: {},
    small: Shadows.small,
    medium: Shadows.medium,
    large: Shadows.large,
  }[shadow];

  const paddingStyles = {
    none: styles.paddingNone,
    small: styles.paddingSmall,
    medium: styles.paddingMedium,
    large: styles.paddingLarge,
  }[padding];

  const radiusStyles = {
    small: { borderRadius: BorderRadius.small },
    medium: { borderRadius: BorderRadius.medium },
    large: { borderRadius: BorderRadius.large },
  }[radius];

  const containerStyles = [
    styles.container,
    shadowStyles,
    paddingStyles,
    radiusStyles,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={containerStyles}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={containerStyles}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: Spacing.sm,
  },
  paddingMedium: {
    padding: Spacing.md,
  },
  paddingLarge: {
    padding: Spacing.lg,
  },
});
