import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput as RNTextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';

export interface DropdownOption<T = string> {
  label: string;
  value: T;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export interface DropdownProps<T = string> {
  /** Selected value */
  value?: T;
  /** Change handler */
  onChange: (value: T) => void;
  /** Options list */
  options: DropdownOption<T>[];
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Container style */
  containerStyle?: any;
  /** Search functionality */
  searchable?: boolean;
}

export function Dropdown<T = string>({
  value,
  onChange,
  options,
  label,
  error,
  required,
  disabled = false,
  placeholder = 'Select an option',
  containerStyle,
  searchable = false,
}: DropdownProps<T>) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const hasError = !!error;

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setVisible(false);
    setSearchQuery('');
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
        accessibilityLabel={label || 'Select option'}
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={[
          styles.inputContainer,
          hasError && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        {selectedOption?.icon && (
          <Ionicons
            name={selectedOption.icon}
            size={20}
            color={disabled ? Colors.gray400 : Colors.text.default}
            style={styles.leftIcon}
          />
        )}
        <Text
          style={[
            styles.text,
            !selectedOption && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
        >
          {selectedOption?.label || placeholder}
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

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text.default} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color={Colors.gray400}
                  style={styles.searchIcon}
                />
                <RNTextInput
                  placeholder="Search..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  placeholderTextColor={Colors.gray400}
                />
              </View>
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  disabled={item.disabled}
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.optionItem,
                    item.value === value && styles.optionItemSelected,
                    item.disabled && styles.optionItemDisabled,
                  ]}
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={
                        item.disabled
                          ? Colors.gray400
                          : item.value === value
                          ? Colors.primary
                          : Colors.text
                      }
                      style={styles.optionIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                      item.disabled && styles.optionTextDisabled,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No options found</Text>
                </View>
              }
              style={styles.optionsList}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.gray100,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  text: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.text.default,
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    maxHeight: '70%',
    overflow: 'hidden',
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
    color: Colors.text.default,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.text.default,
    paddingVertical: Spacing.sm,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  optionItemSelected: {
    backgroundColor: Colors.primary + '10',
  },
  optionItemDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: Spacing.sm,
  },
  optionText: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.text.default,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  optionTextDisabled: {
    color: Colors.gray400,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
});
