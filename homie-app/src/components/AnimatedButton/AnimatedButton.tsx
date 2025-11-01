import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  Animated,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  AccessibilityProps,
} from 'react-native';
import { HapticFeedback } from '@/utils/haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, BorderRadius } from '@/theme';

interface AnimatedButtonProps extends TouchableOpacityProps, AccessibilityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  haptic?: keyof typeof HapticFeedback;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

export function AnimatedButton({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  haptic = 'medium',
  style,
  textStyle,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  ...props
}: AnimatedButtonProps) {
  const { colors } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.95,
        speed: 50,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        speed: 20,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      HapticFeedback[haptic]();
      onPress?.();
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      fontSize: 14,
      minHeight: 36,
    },
    medium: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      fontSize: 16,
      minHeight: 44, // Meets accessibility requirements
    },
    large: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      fontSize: 18,
      minHeight: 52,
    },
  };

  // Variant configurations
  const variantConfig = {
    primary: {
      backgroundColor: disabled ? colors.primary.disabled : colors.primary.default,
      borderWidth: 0,
      textColor: colors.text.inverse,
    },
    secondary: {
      backgroundColor: disabled ? colors.surface.tertiary : colors.secondary.default,
      borderWidth: 0,
      textColor: colors.text.inverse,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: disabled ? colors.border.disabled : colors.primary.default,
      textColor: disabled ? colors.text.tertiary : colors.primary.default,
    },
    danger: {
      backgroundColor: disabled ? colors.error.disabled : colors.error.default,
      borderWidth: 0,
      textColor: colors.text.inverse,
    },
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }],
          opacity: disabled ? 0.5 : opacityValue,
          width: fullWidth ? '100%' : 'auto',
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        accessible={true}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{
          disabled: disabled || loading,
          busy: loading,
        }}
        {...props}
        style={[
          {
            backgroundColor: currentVariant.backgroundColor,
            borderWidth: currentVariant.borderWidth,
            borderColor: currentVariant.borderColor,
            borderRadius: BorderRadius.full,
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
            minHeight: currentSize.minHeight,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={currentVariant.textColor}
          />
        ) : (
          <>
            {icon && (
              <View style={{ marginRight: icon && title ? Spacing.xs : 0 }}>
                {icon}
              </View>
            )}
            <Text
              style={[
                {
                  color: currentVariant.textColor,
                  fontSize: currentSize.fontSize,
                  fontWeight: '600',
                  textAlign: 'center',
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Quick action button with fixed size for FABs
export function AnimatedFAB({
  icon,
  onPress,
  variant = 'primary',
  haptic = 'medium',
  style,
  accessibilityLabel,
  accessibilityHint,
}: {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  haptic?: keyof typeof HapticFeedback;
  style?: ViewStyle;
  accessibilityLabel: string;
  accessibilityHint?: string;
}) {
  const colors = useThemeColors();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.9,
        speed: 50,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        speed: 20,
        bounciness: 10,
        useNativeDriver: true,
      }),
      Animated.timing(rotateValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    HapticFeedback[haptic]();
    onPress();
  };

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }, { rotate }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor:
            variant === 'primary'
              ? colors.primary.default
              : colors.secondary.default,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {icon}
      </TouchableOpacity>
    </Animated.View>
  );
}