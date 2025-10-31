import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { TextInput } from '@/components/Form/TextInput';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useCreateRoom } from '@/hooks/useRooms';
import { ROOM_PRESETS } from '@/constants';
import { validateRoomName } from '@/utils/validation';
import { logError } from '@/utils/errorHandling';

export default function AddRoomScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { household } = useHousehold();
  const { showToast } = useToast();
  const createRoom = useCreateRoom();

  const [roomName, setRoomName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏠');
  const [errors, setErrors] = useState<{ roomName?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePresetSelect = (preset: { name: string; icon: string }) => {
    setRoomName(preset.name);
    setSelectedIcon(preset.icon);
    if (errors.roomName) {
      setErrors({ ...errors, roomName: undefined });
    }
  };

  const handleSubmit = async () => {
    if (!household?.id) {
      showToast('No household found', 'error');
      return;
    }

    // Validate
    const nameValidation = validateRoomName(roomName);
    if (!nameValidation.isValid) {
      setErrors({ roomName: nameValidation.error });
      return;
    }

    setIsSubmitting(true);
    try {
      await createRoom.mutateAsync({
        household_id: household.id,
        name: roomName,
        icon: selectedIcon,
      });

      showToast(`${selectedIcon} ${roomName} added!`, 'success');
      router.back();
    } catch (err: any) {
      logError(err, 'Create Room');
      showToast('Failed to create room. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Room</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          <View style={styles.presetsGrid}>
            {ROOM_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetCard,
                  roomName === preset.name && selectedIcon === preset.icon && styles.presetCardActive,
                ]}
                onPress={() => handlePresetSelect(preset)}
              >
                <Text style={styles.presetIcon}>{preset.icon}</Text>
                <Text style={styles.presetName} numberOfLines={1}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Room */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Room</Text>

          {/* Icon Preview */}
          <View style={styles.iconPreview}>
            <Text style={styles.iconPreviewText}>{selectedIcon}</Text>
          </View>

          {/* Room Name */}
          <TextInput
            label="Room Name"
            placeholder="e.g., Living Room"
            value={roomName}
            onChangeText={(text) => {
              setRoomName(text);
              if (errors.roomName) setErrors({ ...errors, roomName: undefined });
            }}
            error={errors.roomName}
            maxLength={50}
            required
            containerStyle={styles.input}
          />

          {/* Icon Selection */}
          <Text style={styles.label}>
            Icon <Text style={styles.required}>*</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
            {COMMON_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[styles.iconButton, selectedIcon === icon && styles.iconButtonActive]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Text style={styles.iconButtonText}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Rooms help you organize tasks and notes by location in your home.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={isSubmitting ? 'Creating...' : 'Create Room'}
          onPress={handleSubmit}
          disabled={isSubmitting || !roomName.trim()}
          leftIcon={
            isSubmitting ? (
              <ActivityIndicator size="small" color={colors.card} />
            ) : (
              <Ionicons name="add" size={20} color={colors.card} />
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

const COMMON_ICONS = [
  '🏠', '🛋️', '🍳', '🛏️', '🚿', '💻', '🚗', '🌱',
  '🐾', '🎮', '📚', '🎨', '🏋️', '🧺', '🧹', '🗑️',
  '🔧', '🎵', '☕', '🍕', '🎬', '🏡', '🌸', '🎯',
];

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h4,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h5,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  presetCard: {
    width: '25%',
    aspectRatio: 1,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    margin: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  presetIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  presetName: {
    ...Typography.labelSmall,
    color: colors.text,
    textAlign: 'center',
  },
  iconPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  iconPreviewText: {
    fontSize: 40,
  },
  input: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.labelLarge,
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  required: {
    color: colors.error,
  },
  iconScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.medium,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  iconButtonText: {
    fontSize: 28,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  infoText: {
    ...Typography.bodySmall,
    color: colors.text,
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
