import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/theme';
import { useMembers } from '@/hooks/useMembers';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useMembersRealtime } from '@/hooks/useRealtimeSubscription';
import {
  calculateLevel,
  calculateLevelProgress,
  getLevelTitle,
  getLevelColor,
  getStreakEmoji,
} from '@/utils/gamification';

export default function LeaderboardScreen() {
  const { household, member: currentMember } = useHousehold();
  const { data: members = [], isLoading, refetch, isRefetching } = useMembers(household?.id);

  // Real-time updates
  useMembersRealtime(household?.id);

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const renderMemberCard = (member: any, rank: number) => {
    const level = calculateLevel(member.points);
    const levelProgress = calculateLevelProgress(member.points);
    const levelColor = getLevelColor(level);
    const isCurrentUser = member.id === currentMember?.id;

    return (
      <View
        key={member.id}
        style={[styles.memberCard, isCurrentUser && styles.currentMemberCard]}
      >
        {/* Rank Badge */}
        <View style={[styles.rankBadge, rank <= 3 && styles.topRankBadge]}>
          <Text style={styles.rankText}>{getRankEmoji(rank)}</Text>
        </View>

        {/* Member Info */}
        <View style={styles.memberInfo}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberAvatar}>{member.avatar}</Text>
            <View style={styles.memberDetails}>
              <View style={styles.nameRow}>
                <Text style={[styles.memberName, isCurrentUser && styles.currentUserName]}>
                  {member.name}
                  {isCurrentUser && ' (You)'}
                </Text>
                {member.role === 'admin' && (
                  <Text style={styles.adminBadge}>👑</Text>
                )}
              </View>
              <Text style={styles.levelTitle}>{getLevelTitle(level)}</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={Colors.accent} />
              <Text style={styles.statValue}>{member.points}</Text>
              <Text style={styles.statLabel}>points</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.levelBadge, { backgroundColor: levelColor + '30' }]}>
                <Text style={[styles.levelText, { color: levelColor }]}>Lv.{level}</Text>
              </View>
            </View>

            {member.streak_days > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.streakEmoji}>{getStreakEmoji(member.streak_days)}</Text>
                <Text style={styles.statValue}>{member.streak_days}</Text>
                <Text style={styles.statLabel}>streak</Text>
              </View>
            )}
          </View>

          {/* Level Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${levelProgress}%`, backgroundColor: levelColor },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{levelProgress}%</Text>
          </View>
        </View>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard 🏆</Text>
        <Text style={styles.subtitle}>{household?.name || 'Your Household'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No members yet</Text>
            <Text style={styles.emptyText}>
              Invite family members to start competing!
            </Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {members.map((member, index) => renderMemberCard(member, index + 1))}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  membersList: {
    gap: Spacing.md,
  },
  memberCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.medium,
  },
  currentMemberCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  topRankBadge: {
    backgroundColor: Colors.accent + '30',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  memberAvatar: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  memberDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memberName: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: '600',
  },
  currentUserName: {
    color: Colors.primary,
  },
  adminBadge: {
    fontSize: 16,
  },
  levelTitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  statLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  levelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  levelText: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  streakEmoji: {
    fontSize: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },
  emptyState: {
    paddingVertical: Spacing.xxl * 2,
    alignItems: 'center',
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
});
