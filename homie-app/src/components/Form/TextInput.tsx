import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';

export interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Helper text below input */
  helperText?: string;
  /** Left icon */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Right icon */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  /** Right icon press handler */
  onRightIconPress?: () => void;
  /** Container style */
  containerStyle?: any;
  /** Custom style for the input field itself */
  inputStyle?: any;
}

export function TextInput({
  label,
  error,
  required,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  editable = true,
  ...rest
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const isDisabled = !editable;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          isDisabled && styles.inputContainerDisabled,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isDisabled ? Colors.gray400 : Colors.gray600}
            style={styles.leftIcon}
          />
        )}

        <RNTextInput
          accessible
          accessibilityLabel={label}
          accessibilityRequired={required}
          placeholderTextColor={Colors.gray400}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            isDisabled && styles.inputDisabled,
            inputStyle,
          ]}
          {...rest}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress || isDisabled}
            style={styles.rightIconContainer}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={isDisabled ? Colors.gray400 : Colors.gray600}
            />
          </TouchableOpacity>
        )}
      </View>

      {(error || helperText) && (
        <View style={styles.bottomContainer}>
          {hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            helperText && <Text style={styles.helperText}>{helperText}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelContainer: {
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.labelMedium,
    color: Colors.text.default,
    fontWeight: '500',
  },
  required: {
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.gray300,
    paddingHorizontal: Spacing.md,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray300,
  },
  input: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.text.default,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  inputDisabled: {
    color: Colors.gray500,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIconContainer: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  bottomContainer: {
    marginTop: Spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
  },
  helperText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
