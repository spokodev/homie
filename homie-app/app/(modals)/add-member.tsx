import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useCreateMember } from '@/hooks/useMembers';
import { useCreateInvitation } from '@/hooks/useInvitations';
import { useHousehold } from '@/contexts/HouseholdContext';
import { TextInput } from '@/components/Form/TextInput';
import { useToast } from '@/components/Toast';
import { COMMON_AVATARS, PET_AVATARS } from '@/constants';
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';

export default function AddMemberModal() {
  const router = useRouter();
  const colors = useThemeColors();
  const { household, member: currentMember } = useHousehold();
  const createMember = useCreateMember();
  const createInvitation = useCreateInvitation();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('😊');
  const [isPet, setIsPet] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQR, setShowQR] = useState(false);

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
      // Create the member
      const newMember = await createMember.mutateAsync({
        household_id: household.id,
        name: name.trim(),
        avatar: selectedAvatar,
        type: isPet ? 'pet' : 'human',
        role: 'member',
        // user_id is null for pets and non-user members
        user_id: undefined,
      });

      // For human members, create an invitation
      if (!isPet) {
        try {
          const invitation = await createInvitation.mutateAsync({
            household_id: household.id,
            member_id: newMember.id,
            member_name: name.trim(),
            invited_by: currentMember.id,
          });

          setInviteCode(invitation.invite_code);
          setShowInviteModal(true);
        } catch (inviteError: any) {
          console.error('Failed to create invitation:', inviteError);
          // Still show success but warn about invitation
          showToast('Member added but invitation failed', 'warning');
          router.back();
        }
      } else {
        // For pets, just show success
        showToast('Pet added successfully! 🐾', 'success');
        router.back();
      }

      // Track member added
      trackEvent(ANALYTICS_EVENTS.MEMBER_ADDED, {
        member_type: isPet ? 'pet' : 'human',
        member_role: 'member',
        with_invitation: !isPet,
      });

    } catch (error: any) {
      showToast(error.message || 'Failed to add member', 'error');
    }
  };

  const handleCopyCode = async () => {
    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode);
      showToast('Invitation code copied!', 'success');
    }
  };

  const handleShareCode = async () => {
    if (inviteCode && household) {
      try {
        const message = `Join my family "${household.name}" on HomieLife!\n\nInvitation code: ${inviteCode}\n\n1. Download HomieLife app\n2. Sign up or log in\n3. Enter this code to join`;

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          await Share.share({
            message,
            title: 'HomieLife Invitation',
          });
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const InviteCodeModal = () => {
    if (!showInviteModal || !inviteCode) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.inviteModal}>
          <Text style={styles.inviteTitle}>Member Added! 🎉</Text>
          <Text style={styles.inviteSubtitle}>
            Share this code with {name} to let them join your household:
          </Text>

          {/* Toggle between Code and QR */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleOption, !showQR && styles.toggleOptionActive]}
              onPress={() => setShowQR(false)}
            >
              <Text style={[styles.toggleOptionText, !showQR && styles.toggleOptionTextActive]}>
                Code
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleOption, showQR && styles.toggleOptionActive]}
              onPress={() => setShowQR(true)}
            >
              <Text style={[styles.toggleOptionText, showQR && styles.toggleOptionTextActive]}>
                QR Code
              </Text>
            </TouchableOpacity>
          </View>

          {/* Code or QR Display */}
          {showQR ? (
            <View style={styles.qrContainer}>
              <QRCode
                value={`homielife://join/${inviteCode}`}
                size={200}
                backgroundColor="white"
                color={colors.primary}
              />
              <Text style={styles.qrHint}>Scan with HomieLife app</Text>
            </View>
          ) : (
            <View style={styles.codeContainer}>
              <Text style={styles.inviteCode}>{inviteCode}</Text>
            </View>
          )}

          <View style={styles.inviteActions}>
            <TouchableOpacity
              style={[styles.inviteButton, styles.copyButton]}
              onPress={handleCopyCode}
            >
              <Ionicons name="copy-outline" size={20} color={colors.card} />
              <Text style={styles.inviteButtonText}>Copy Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.inviteButton, styles.shareButton]}
              onPress={handleShareCode}
            >
              <Ionicons name="share-outline" size={20} color={colors.card} />
              <Text style={styles.inviteButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inviteNote}>
            This code expires in 7 days. They can enter it when signing up or scan the QR code.
          </Text>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => {
              setShowInviteModal(false);
              setShowQR(false);
              router.back();
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Member</Text>
          <TouchableOpacity onPress={handleCreate} disabled={createMember.isPending}>
            {createMember.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
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
                trackColor={{ false: colors.gray300, true: colors.secondary }}
                thumbColor={isPet ? colors.card : colors.card}
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
            color={colors.secondary}
          />
          <Text style={styles.infoText}>
            {isPet
              ? 'Pets appear in the leaderboard and can have tasks assigned to them. Perfect for tracking pet care responsibilities!'
              : 'Members can sign up later with their email to get their own login and track their progress.'}
          </Text>
        </View>

        {currentMember?.role !== 'admin' && (
          <View style={[styles.infoCard, styles.warningCard]}>
            <Ionicons name="warning" size={20} color={colors.warning} />
            <Text style={styles.infoText}>
              Only household admins can add new members.
            </Text>
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
      <InviteCodeModal />
    </>
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
    borderBottomColor: colors.gray300,
    backgroundColor: colors.card,
  },
  headerTitle: {
    ...Typography.h4,
    color: colors.text,
  },
  cancelButton: {
    ...Typography.bodyLarge,
    color: colors.textSecondary,
  },
  createButton: {
    ...Typography.bodyLarge,
    color: colors.primary,
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
    backgroundColor: colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    ...Typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleSubtext: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
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
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  required: {
    color: colors.error,
  },
  avatarPreview: {
    alignItems: 'center',
    backgroundColor: colors.card,
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
    color: colors.text,
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
    borderColor: colors.gray300,
    backgroundColor: colors.card,
  },
  avatarButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  avatarButtonText: {
    fontSize: 28,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary + '15',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  warningCard: {
    backgroundColor: colors.warning + '15',
  },
  infoText: {
    ...Typography.bodyMedium,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  // Invitation modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  inviteModal: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  inviteTitle: {
    ...Typography.h3,
    color: colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  inviteSubtitle: {
    ...Typography.bodyLarge,
    color: colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: colors.gray100,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  inviteCode: {
    ...Typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    gap: Spacing.xs,
  },
  copyButton: {
    backgroundColor: colors.secondary,
  },
  shareButton: {
    backgroundColor: colors.primary,
  },
  inviteButtonText: {
    ...Typography.bodyMedium,
    color: colors.card,
    fontWeight: '600',
  },
  inviteNote: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  doneButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  doneButtonText: {
    ...Typography.bodyLarge,
    color: colors.primary,
    fontWeight: '600',
  },
  // QR Code styles
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: BorderRadius.medium,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: colors.card,
  },
  toggleOptionText: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
  },
  toggleOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  qrHint: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
