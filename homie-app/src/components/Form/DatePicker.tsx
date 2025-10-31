import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  StyleSheet,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';

export interface DatePickerProps {
  /** Selected date */
  value?: Date;
  /** Change handler */
  onChange: (date: Date) => void;
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Minimum date */
  minimumDate?: Date;
  /** Maximum date */
  maximumDate?: Date;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Date display format */
  format?: 'short' | 'medium' | 'long';
  /** Container style */
  containerStyle?: any;
}

export function DatePicker({
  value,
  onChange,
  label,
  error,
  required,
  minimumDate,
  maximumDate,
  disabled = false,
  placeholder = 'Select date',
  format = 'medium',
  containerStyle,
}: DatePickerProps) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const hasError = !!error;

  const formatDate = (date: Date | undefined): string => {
    if (!date) return placeholder;

    const options: Intl.DateTimeFormatOptions = {
      short: { month: 'short', day: 'numeric', year: 'numeric' },
      medium: { month: 'long', day: 'numeric', year: 'numeric' },
      long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    }[format];

    return date.toLocaleDateString('en-US', options);
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (event.type === 'set' && selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        onChange(selectedDate);
      }
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShow(false);
  };

  const handleCancel = () => {
    setTempDate(value || new Date());
    setShow(false);
  };

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

      <TouchableOpacity
        accessible
        accessibilityRole="button"
        accessibilityLabel={label || 'Select date'}
        disabled={disabled}
        onPress={() => setShow(true)}
        style={[
          styles.inputContainer,
          hasError && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={disabled ? Colors.gray400 : Colors.gray600}
          style={styles.icon}
        />
        <Text
          style={[
            styles.text,
            !value && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
        >
          {formatDate(value)}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? Colors.gray400 : Colors.gray600}
        />
      </TouchableOpacity>

      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {show && (
        <>
          {Platform.OS === 'ios' ? (
            <Modal transparent animationType="slide" visible={show}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={handleCancel}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Select Date</Text>
                    <TouchableOpacity onPress={handleConfirm}>
                      <Text style={styles.modalDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={handleChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    themeVariant="light"
                    locale="en-US"
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              onChange={handleChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              locale="en-US"
            />
          )}
        </>
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
    color: Colors.text,
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
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.gray100,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.gray400,
  },
  disabledText: {
    color: Colors.gray500,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  modalCancelText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  modalDoneText: {
    ...Typography.button,
    color: Colors.primary,
    fontWeight: '600',
  },
});
