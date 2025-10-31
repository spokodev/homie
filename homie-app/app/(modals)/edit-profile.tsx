import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useUpdateMember } from '@/hooks/useMembers';
import { COMMON_AVATARS } from '@/constants';
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

export default function EditProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { member } = useHousehold();
  const updateMember = useUpdateMember();

  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😊');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setSelectedAvatar(member.avatar || '😊');
    }
  }, [member]);

  const handleSave = async () => {
    if (!member) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 50) {
      Alert.alert('Error', 'Name must be less than 50 characters');
      return;
    }

    setSaving(true);
    try {
      await updateMember.mutateAsync({
        id: member.id,
        updates: {
          name: trimmedName,
          avatar: selectedAvatar,
        },
      });

      trackEvent(ANALYTICS_EVENTS.PROFILE_UPDATED, {
        member_id: member.id,
        avatar_changed: selectedAvatar !== member.avatar,
        name_changed: trimmedName !== member.name,
      });

      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Preview */}
        <View style={styles.previewSection}>
          <View style={styles.avatarPreview}>
            <Text style={styles.avatarPreviewText}>{selectedAvatar}</Text>
          </View>
          <Text style={styles.previewName}>{name || 'Your Name'}</Text>
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.gray400}
            maxLength={50}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>{name.length}/50 characters</Text>
        </View>

        {/* Avatar Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Choose Avatar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.avatarScroll}
          >
            {COMMON_AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar}
                style={[
                  styles.avatarOption,
                  selectedAvatar === avatar && styles.avatarOptionSelected,
                ]}
                onPress={() => setSelectedAvatar(avatar)}
              >
                <Text style={styles.avatarOptionText}>{avatar}</Text>
                {selectedAvatar === avatar && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark" size={16} color={colors.card} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Info Note */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your member type (human/pet) cannot be changed after account creation.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.card,
  },
  headerTitle: {
    ...Typography.h4,
    color: colors.text,
  },
  saveButton: {
    ...Typography.button,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    paddingVertical: Spacing.xl,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPreviewText: {
    fontSize: 50,
  },
  previewName: {
    ...Typography.h3,
    color: colors.text,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.labelLarge,
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    ...Typography.bodyLarge,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helperText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  avatarScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  avatarGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatarOption: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.medium,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  avatarOptionText: {
    fontSize: 32,
  },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.bodyMedium,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
});
