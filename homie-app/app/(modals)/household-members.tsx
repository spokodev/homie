import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadows } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useMembers, useDeleteMember } from '@/hooks/useMembers';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useToast } from '@/components/Toast';
import { calculateLevel, getLevelTitle } from '@/utils/gamification';

export default function HouseholdMembersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { household, member: currentMember } = useHousehold();
  const { data: members = [], isLoading, refetch } = useMembers(household?.id);
  const deleteMember = useDeleteMember();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create styles early to avoid hoisting issues
  const styles = createStyles(colors);

  const handleAddMember = () => {
    if (currentMember?.role !== 'admin') {
      showToast('Only admins can add members', 'error');
      return;
    }
    router.push('/(modals)/add-member');
  };

  const handleManageInvitations = () => {
    if (currentMember?.role !== 'admin') {
      showToast('Only admins can manage invitations', 'error');
      return;
    }
    router.push('/(modals)/manage-invitations');
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (currentMember?.role !== 'admin') {
      showToast('Only admins can remove members', 'error');
      return;
    }

    if (memberId === currentMember.id) {
      showToast('You cannot remove yourself', 'error');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName}? This will delete all their data.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(memberId);
            try {
              await deleteMember.mutateAsync({ id: memberId, householdId: household!.id });
              showToast(`${memberName} removed successfully`, 'success');
              refetch();
            } catch (error: any) {
              showToast(error.message || 'Failed to remove member', 'error');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const renderMemberCard = (member: any) => {
    const level = calculateLevel(member.points);
    const levelTitle = getLevelTitle(level);
    const isCurrentUser = member.id === currentMember?.id;
    const isDeleting = deletingId === member.id;

    return (
      <View key={member.id} style={styles.memberCard}>
        {/* Member Info */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberAvatar}>{member.avatar}</Text>
          <View style={styles.memberDetails}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>
                {member.name}
                {isCurrentUser && ' (You)'}
              </Text>
              {member.role === 'admin' && (
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
              )}
              {member.type === 'pet' && (
                <Text style={styles.petBadge}>🐾</Text>
              )}
            </View>
            {member.type === 'human' && (
              <Text style={styles.levelText}>{levelTitle}</Text>
            )}
            {member.type === 'pet' && (
              <Text style={styles.petText}>Pet</Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.memberStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color={colors.accent} />
            <Text style={styles.statValue}>{member.points}</Text>
          </View>
          {member.streak_days > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="flame" size={16} color={colors.warning} />
              <Text style={styles.statValue}>{member.streak_days}</Text>
            </View>
          )}
        </View>

        {/* Delete Button (Admins Only, Can't Delete Self) */}
        {currentMember?.role === 'admin' && !isCurrentUser && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMember(member.id, member.name)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const humanMembers = members.filter((m) => m.type === 'human');
  const pets = members.filter((m) => m.type === 'pet');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Members</Text>
        <TouchableOpacity onPress={handleAddMember}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Household Name */}
        <View style={styles.householdCard}>
          <Text style={styles.householdIcon}>{household?.icon || '🏠'}</Text>
          <Text style={styles.householdName}>{household?.name || 'Household'}</Text>
          <Text style={styles.householdSubtext}>
            {members.length} {members.length === 1 ? 'member' : 'members'} total
          </Text>
        </View>

        {/* Family Members */}
        {humanMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Family Members ({humanMembers.length})</Text>
            {humanMembers.map(renderMemberCard)}
          </View>
        )}

        {/* Pets */}
        {pets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pets ({pets.length})</Text>
            {pets.map(renderMemberCard)}
          </View>
        )}

        {/* Empty State */}
        {members.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No members yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button above to add family members or pets!
            </Text>
          </View>
        )}

        {/* Admin Actions */}
        {currentMember?.role === 'admin' && members.length > 0 && (
          <View style={styles.adminActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddMember}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>Add Member</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleManageInvitations}>
              <Ionicons name="mail-outline" size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>Invitations</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Info */}
        {currentMember?.role !== 'admin' && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={colors.secondary} />
            <Text style={styles.infoText}>
              Only household admins can add or remove members.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  householdCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.small,
  },
  householdIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  householdName: {
    ...Typography.h3,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  householdSubtext: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memberName: {
    ...Typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  levelText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  petBadge: {
    fontSize: 14,
  },
  petText: {
    ...Typography.bodySmall,
    color: colors.secondary,
    marginTop: 2,
  },
  memberStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginRight: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...Typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  adminActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  actionButtonText: {
    ...Typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h4,
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary + '15',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.bodyMedium,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
});
