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
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useUpdateMember } from '@/hooks/useMembers';
import { COMMON_AVATARS } from '@/constants';
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

export default function EditProfileScreen() {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
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
            placeholderTextColor={Colors.gray400}
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
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Info Note */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Your member type (human/pet) cannot be changed after account creation.
          </Text>
        </View>
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
    borderBottomColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  saveButton: {
    ...Typography.button,
    color: Colors.primary,
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
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarPreviewText: {
    fontSize: 50,
  },
  previewName: {
    ...Typography.h3,
    color: Colors.text,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.labelLarge,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    ...Typography.bodyLarge,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  helperText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray300,
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  avatarOptionText: {
    fontSize: 32,
  },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
});
