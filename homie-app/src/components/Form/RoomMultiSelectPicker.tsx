import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useRooms } from '@/hooks/useRooms';

export interface RoomMultiSelectPickerProps {
  /** Selected room IDs */
  value: string[];
  /** Change handler */
  onChange: (roomIds: string[]) => void;
  /** Household ID to fetch rooms for */
  householdId: string;
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
  /** Allow multiple selection */
  multiple?: boolean;
}

export function RoomMultiSelectPicker({
  value,
  onChange,
  householdId,
  label,
  error,
  required,
  disabled = false,
  placeholder = 'Select room(s)',
  containerStyle,
  multiple = true,
}: RoomMultiSelectPickerProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [visible, setVisible] = useState(false);

  const { data: rooms = [], isLoading } = useRooms(householdId);

  const hasError = !!error;

  const selectedRooms = rooms.filter(room => value.includes(room.id));

  const handleToggle = (roomId: string) => {
    if (multiple) {
      // Multiple selection mode
      if (value.includes(roomId)) {
        onChange(value.filter(id => id !== roomId));
      } else {
        onChange([...value, roomId]);
      }
    } else {
      // Single selection mode
      onChange([roomId]);
      setVisible(false);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const handleDone = () => {
    setVisible(false);
  };

  const getDisplayText = () => {
    if (selectedRooms.length === 0) {
      return placeholder;
    }
    if (selectedRooms.length === 1) {
      return `${selectedRooms[0].icon} ${selectedRooms[0].name}`;
    }
    return `${selectedRooms.length} rooms selected`;
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
        accessibilityLabel={label || 'Select rooms'}
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={[
          styles.inputContainer,
          hasError && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        <Text
          style={[
            styles.text,
            selectedRooms.length === 0 && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
        >
          {getDisplayText()}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? colors.gray400 : colors.gray600}
        />
      </TouchableOpacity>

      {/* Selected rooms chips */}
      {selectedRooms.length > 1 && (
        <View style={styles.chipsContainer}>
          {selectedRooms.map(room => (
            <View key={room.id} style={styles.chip}>
              <Text style={styles.chipIcon}>{room.icon}</Text>
              <Text style={styles.chipText}>{room.name}</Text>
              {!disabled && (
                <TouchableOpacity
                  onPress={() => handleToggle(room.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={colors.error} />
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
              <Text style={styles.modalTitle}>
                {label || 'Select Rooms'}
                {multiple && value.length > 0 && ` (${value.length})`}
              </Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading rooms...</Text>
              </View>
            ) : (
              <FlatList
                data={rooms}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = value.includes(item.id);
                  return (
                    <TouchableOpacity
                      onPress={() => handleToggle(item.id)}
                      style={[
                        styles.roomItem,
                        isSelected && styles.roomItemSelected,
                      ]}
                    >
                      <View style={styles.roomIconContainer}>
                        <Text style={styles.roomIcon}>{item.icon}</Text>
                      </View>
                      <Text
                        style={[
                          styles.roomText,
                          isSelected && styles.roomTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name={multiple ? "checkbox" : "checkmark-circle"}
                          size={24}
                          color={colors.primary}
                        />
                      )}
                      {!isSelected && multiple && (
                        <Ionicons
                          name="square-outline"
                          size={24}
                          color={colors.gray400}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="home-outline" size={48} color={colors.gray400} />
                    <Text style={styles.emptyText}>No rooms available</Text>
                    <Text style={styles.emptyHint}>Add rooms to your household first</Text>
                  </View>
                }
                style={styles.roomsList}
              />
            )}

            {multiple && value.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClear}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleDone}
                >
                  <Text style={styles.doneButtonText}>
                    Done ({value.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelContainer: {
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.labelMedium,
    color: colors.text,
    fontWeight: '500',
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: colors.gray100,
    opacity: 0.6,
  },
  text: {
    flex: 1,
    ...Typography.bodyLarge,
    color: colors.text,
  },
  placeholderText: {
    color: colors.gray400,
  },
  disabledText: {
    color: colors.gray500,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    ...Typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.bodySmall,
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.card,
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
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...Typography.h4,
    color: colors.text,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
  },
  roomsList: {
    maxHeight: 400,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roomItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  roomIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  roomIcon: {
    fontSize: 20,
  },
  roomText: {
    flex: 1,
    ...Typography.bodyLarge,
    color: colors.text,
  },
  roomTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: colors.text,
    marginTop: Spacing.md,
  },
  emptyHint: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  clearButtonText: {
    ...Typography.button,
    color: colors.text,
  },
  doneButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  doneButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
});
