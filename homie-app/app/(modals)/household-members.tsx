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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/theme';
import { useMembers, useDeleteMember } from '@/hooks/useMembers';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useToast } from '@/components/Toast';
import { calculateLevel, getLevelTitle } from '@/utils/gamification';

export default function HouseholdMembersScreen() {
  const router = useRouter();
  const { household, member: currentMember } = useHousehold();
  const { data: members = [], isLoading, refetch } = useMembers(household?.id);
  const deleteMember = useDeleteMember();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddMember = () => {
    if (currentMember?.role !== 'admin') {
      showToast('Only admins can add members', 'error');
      return;
    }
    router.push('/(modals)/add-member');
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
              await deleteMember.mutateAsync(memberId);
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
                <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
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
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text style={styles.statValue}>{member.points}</Text>
          </View>
          {member.streak_days > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="flame" size={16} color={Colors.warning} />
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
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
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
          <ActivityIndicator size="large" color={Colors.primary} />
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
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Members</Text>
        <TouchableOpacity onPress={handleAddMember}>
          <Ionicons name="add-circle" size={24} color={Colors.primary} />
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

        {/* Add Member CTA */}
        {currentMember?.role === 'admin' && members.length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
            <Text style={styles.addButtonText}>Add Member or Pet</Text>
          </TouchableOpacity>
        )}

        {/* Admin Info */}
        {currentMember?.role !== 'admin' && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={Colors.secondary} />
            <Text style={styles.infoText}>
              Only household admins can add or remove members.
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
    borderBottomColor: Colors.gray300,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  householdCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
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
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  householdSubtext: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
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
    color: Colors.text,
    fontWeight: '600',
  },
  levelText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  petBadge: {
    fontSize: 14,
  },
  petText: {
    ...Typography.bodySmall,
    color: Colors.secondary,
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
    color: Colors.text,
    fontWeight: '600',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    padding: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  addButtonText: {
    ...Typography.bodyLarge,
    color: Colors.primary,
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
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary + '15',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
});
