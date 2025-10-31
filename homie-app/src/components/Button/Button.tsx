import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';
export type IconPosition = 'left' | 'right';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Button text */
  title: string;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size variant */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Optional icon */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon position */
  iconPosition?: IconPosition;
  /** Full width button */
  fullWidth?: boolean;
  /** Custom button styles */
  style?: TouchableOpacityProps['style'];
  /** Left icon element (alternative to icon prop) */
  leftIcon?: React.ReactElement;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  leftIcon,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Get variant styles
  const variantStyles = {
    primary: {
      container: styles.primaryContainer,
      text: styles.primaryText,
      disabledContainer: styles.primaryDisabled,
    },
    secondary: {
      container: styles.secondaryContainer,
      text: styles.secondaryText,
      disabledContainer: styles.secondaryDisabled,
    },
    outline: {
      container: styles.outlineContainer,
      text: styles.outlineText,
      disabledContainer: styles.outlineDisabled,
    },
    text: {
      container: styles.textContainer,
      text: styles.textText,
      disabledContainer: styles.textDisabled,
    },
    danger: {
      container: styles.dangerContainer,
      text: styles.dangerText,
      disabledContainer: styles.dangerDisabled,
    },
  }[variant];

  // Get size styles
  const sizeStyles = {
    small: styles.smallContainer,
    medium: styles.mediumContainer,
    large: styles.largeContainer,
  }[size];

  const iconSize = {
    small: 16,
    medium: 20,
    large: 24,
  }[size];

  const textStyle = {
    small: styles.smallText,
    medium: styles.mediumText,
    large: styles.largeText,
  }[size];

  const iconColor = variant === 'outline' || variant === 'text'
    ? Colors.primary
    : Colors.white;

  return (
    <TouchableOpacity
      accessible
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.baseContainer,
        variantStyles.container,
        sizeStyles,
        fullWidth && styles.fullWidth,
        isDisabled && variantStyles.disabledContainer,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? Colors.primary : Colors.white}
          size="small"
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          {icon && iconPosition === 'left' && !leftIcon && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={isDisabled ? Colors.gray400 : iconColor}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              variantStyles.text,
              textStyle,
              isDisabled && styles.disabledText,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={isDisabled ? Colors.gray400 : iconColor}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },

  // Variant Styles - Primary
  primaryContainer: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: {
    color: Colors.white,
    fontWeight: '600',
  },
  primaryDisabled: {
    backgroundColor: Colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Variant Styles - Secondary
  secondaryContainer: {
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryText: {
    color: Colors.white,
    fontWeight: '600',
  },
  secondaryDisabled: {
    backgroundColor: Colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Variant Styles - Outline
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  outlineText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  outlineDisabled: {
    borderColor: Colors.gray300,
  },

  // Variant Styles - Text
  textContainer: {
    backgroundColor: 'transparent',
  },
  textText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  textDisabled: {
    opacity: 0.5,
  },

  // Variant Styles - Danger
  dangerContainer: {
    backgroundColor: Colors.error,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerText: {
    color: Colors.white,
    fontWeight: '600',
  },
  dangerDisabled: {
    backgroundColor: Colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Size Styles
  smallContainer: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  mediumContainer: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  largeContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  // Text Size Styles
  smallText: {
    ...Typography.labelSmall,
  },
  mediumText: {
    ...Typography.button,
  },
  largeText: {
    ...Typography.h4,
  },

  // Disabled Text
  disabledText: {
    color: Colors.gray400,
  },

  // Icon Styles
  iconLeft: {
    marginRight: Spacing.xs,
  },
  iconRight: {
    marginLeft: Spacing.xs,
  },
});

// Convenience exports for specific variants
export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="secondary" />;
}

export function OutlineButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="outline" />;
}

export function TextButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="text" />;
}

export function DangerButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="danger" />;
}
