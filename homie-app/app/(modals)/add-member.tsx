import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { useCreateMember } from '@/hooks/useMembers';
import { useHousehold } from '@/contexts/HouseholdContext';
import { TextInput } from '@/components/Form/TextInput';
import { useToast } from '@/components/Toast';
import { COMMON_AVATARS, PET_AVATARS } from '@/constants';
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

export default function AddMemberModal() {
  const router = useRouter();
  const { household, member: currentMember } = useHousehold();
  const createMember = useCreateMember();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😊');
  const [isPet, setIsPet] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Switch avatars based on pet/human type
  const avatars = isPet ? PET_AVATARS : COMMON_AVATARS;

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (name.trim().length > 30) {
      newErrors.name = 'Name must be less than 30 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    if (!household) {
      showToast('No household found', 'error');
      return;
    }

    // Only admins can add members
    if (currentMember?.role !== 'admin') {
      showToast('Only admins can add members', 'error');
      return;
    }

    try {
      await createMember.mutateAsync({
        household_id: household.id,
        name: name.trim(),
        avatar: selectedAvatar,
        type: isPet ? 'pet' : 'human',
        role: 'member',
        // user_id is null for pets and non-user members
        user_id: undefined,
      });

      // Track member added
      trackEvent(ANALYTICS_EVENTS.MEMBER_ADDED, {
        member_type: isPet ? 'pet' : 'human',
        member_role: 'member',
      });

      showToast(
        isPet ? 'Pet added successfully! 🐾' : 'Member added successfully!',
        'success'
      );
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to add member', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Member</Text>
        <TouchableOpacity onPress={handleCreate} disabled={createMember.isPending}>
          {createMember.isPending ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.createButton}>Add</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Member Type Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>
                {isPet ? 'Adding a Pet' : 'Adding a Person'}
              </Text>
              <Text style={styles.toggleSubtext}>
                {isPet
                  ? 'Pets can have tasks but cannot log in'
                  : 'Family members can complete tasks and earn points'}
              </Text>
            </View>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleIcon}>👤</Text>
              <Switch
                value={isPet}
                onValueChange={setIsPet}
                trackColor={{ false: Colors.gray300, true: Colors.secondary }}
                thumbColor={isPet ? Colors.white : Colors.white}
              />
              <Text style={styles.toggleIcon}>🐾</Text>
            </View>
          </View>
        </View>

        {/* Name */}
        <TextInput
          label="Name"
          placeholder={isPet ? "e.g., Fluffy" : "e.g., Mom"}
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          error={errors.name}
          required
          autoFocus
          editable={!createMember.isPending}
          containerStyle={styles.section}
        />

        {/* Avatar Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Choose Avatar <Text style={styles.required}>*</Text>
          </Text>

          {/* Preview */}
          <View style={styles.avatarPreview}>
            <Text style={styles.avatarPreviewIcon}>{selectedAvatar}</Text>
            <Text style={styles.avatarPreviewText}>
              {name.trim() || (isPet ? 'Your Pet' : 'New Member')}
            </Text>
          </View>

          {/* Avatar Grid */}
          <View style={styles.avatarsGrid}>
            {avatars.map((avatar) => (
              <TouchableOpacity
                key={avatar}
                style={[
                  styles.avatarButton,
                  selectedAvatar === avatar && styles.avatarButtonSelected,
                ]}
                onPress={() => setSelectedAvatar(avatar)}
                disabled={createMember.isPending}
              >
                <Text style={styles.avatarButtonText}>{avatar}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <Ionicons
            name={isPet ? 'paw' : 'information-circle'}
            size={20}
            color={Colors.secondary}
          />
          <Text style={styles.infoText}>
            {isPet
              ? 'Pets appear in the leaderboard and can have tasks assigned to them. Perfect for tracking pet care responsibilities!'
              : 'Members can sign up later with their email to get their own login and track their progress.'}
          </Text>
        </View>

        {currentMember?.role !== 'admin' && (
          <View style={[styles.infoCard, styles.warningCard]}>
            <Ionicons name="warning" size={20} color={Colors.warning} />
            <Text style={styles.infoText}>
              Only household admins can add new members.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray300,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  cancelButton: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  createButton: {
    ...Typography.bodyLarge,
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleSubtext: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toggleIcon: {
    fontSize: 20,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.error,
  },
  avatarPreview: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  avatarPreviewIcon: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
  avatarPreviewText: {
    ...Typography.h4,
    color: Colors.text,
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  avatarButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
  },
  avatarButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  avatarButtonText: {
    fontSize: 28,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary + '15',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  warningCard: {
    backgroundColor: Colors.warning + '15',
  },
  infoText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
});
