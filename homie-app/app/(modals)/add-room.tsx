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
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.text} />
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
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
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
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="add" size={20} color={Colors.white} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray300,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h4,
    color: Colors.text,
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
    color: Colors.text,
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
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    margin: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  presetIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  presetName: {
    ...Typography.labelSmall,
    color: Colors.text,
    textAlign: 'center',
  },
  iconPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent + '20',
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
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.error,
  },
  iconScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  iconButtonText: {
    fontSize: 28,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.text,
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray300,
  },
});
