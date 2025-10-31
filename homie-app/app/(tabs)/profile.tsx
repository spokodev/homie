import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadows } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useMembers } from '@/hooks/useMembers';
import { useTasks } from '@/hooks/useTasks';
import { calculateLevel, getLevelTitle, getLevelColor } from '@/utils/gamification';
import { useGroupedBadges, useBadgeStats } from '@/hooks/useBadges';
import { usePremiumStore } from '@/stores/premium.store';
import { useCaptainStats } from '@/hooks/useCaptain';

export default function ProfileScreen() {
  const colors = useThemeColors();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { household, member } = useHousehold();
  const { data: allMembers = [] } = useMembers(household?.id);
  const { data: allTasks = [] } = useTasks(household?.id);
  const [loading, setLoading] = useState(false);
  const isPremium = usePremiumStore((state) => state.isPremium);

  const styles = createStyles(colors);

  // Badges
  const { earned, locked } = useGroupedBadges(member?.id, isPremium);
  const { earnedCount, totalCount } = useBadgeStats(member?.id, isPremium);

  // Captain stats
  const { data: captainStats } = useCaptainStats(member?.id);

  // Calculate stats
  const level = member ? calculateLevel(member.points) : 1;
  const levelTitle = getLevelTitle(level);
  const levelColor = getLevelColor(level);
  const rank = member ? allMembers.findIndex(m => m.id === member.id) + 1 : 0;
  const tasksCompleted = allTasks.filter(
    t => t.status === 'completed' && t.assignee_id === member?.id
  ).length;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.card}>
          <View style={[styles.avatarContainer, { borderColor: levelColor, borderWidth: 3 }]}>
            <Text style={styles.avatar}>{member?.avatar || '😊'}</Text>
          </View>
          <Text style={styles.name}>{member?.name || 'Loading...'}</Text>
          <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <Ionicons name="star" size={14} color={colors.text.inverse} />
            <Text style={styles.levelText}>Level {level}</Text>
          </View>
          <Text style={styles.levelTitle}>{levelTitle}</Text>
          {member?.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.text.inverse} />
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color={colors.accent.default} />
              <Text style={styles.statValue}>{member?.points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success.default} />
              <Text style={styles.statValue}>{tasksCompleted}</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color={colors.warning.default} />
              <Text style={styles.statValue}>{member?.streak_days || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color={colors.primary.default} />
              <Text style={styles.statValue}>#{rank || '-'}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="home" size={24} color={colors.secondary.default} />
              <Text style={styles.statValue}>{household?.icon || '🏠'}</Text>
              <Text style={styles.statLabel}>{household?.name || 'Loading...'}</Text>
            </View>
          </View>
        </View>

        {/* Captain Stats Section */}
        {captainStats && captainStats.times_captain > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Captain Stats</Text>
              <Ionicons name="ribbon" size={20} color={colors.accent.default} />
            </View>
            <View style={styles.captainStatsCard}>
              <View style={styles.captainStatItem}>
                <Ionicons name="shield" size={24} color={colors.primary.default} />
                <Text style={styles.captainStatValue}>{captainStats.times_captain}</Text>
                <Text style={styles.captainStatLabel}>Times Captain</Text>
              </View>
              {captainStats.average_rating && (
                <View style={styles.captainStatItem}>
                  <Ionicons name="star" size={24} color={colors.accent.default} />
                  <Text style={styles.captainStatValue}>
                    {captainStats.average_rating.toFixed(1)}
                  </Text>
                  <Text style={styles.captainStatLabel}>Avg Rating</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Badges</Text>
            <Text style={styles.badgeCount}>{earnedCount}/{totalCount}</Text>
          </View>

          {earned.length > 0 && (
            <>
              <Text style={styles.badgesSubtitle}>Earned</Text>
              <View style={styles.badgesGrid}>
                {earned.slice(0, 6).map((badge) => (
                  <View key={badge.id} style={styles.badgeItem}>
                    <View style={[styles.badgeIconContainer, styles.badgeEarned]}>
                      <Text style={styles.badgeIconLarge}>{badge.icon}</Text>
                    </View>
                    <Text style={styles.badgeName} numberOfLines={1}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {locked.length > 0 && (
            <>
              <Text style={styles.badgesSubtitle}>Locked</Text>
              <View style={styles.badgesGrid}>
                {locked.slice(0, 6).map((badge) => (
                  <View key={badge.id} style={styles.badgeItem}>
                    <View style={[styles.badgeIconContainer, styles.badgeLocked]}>
                      <Text style={[styles.badgeIconLarge, styles.badgeIconGray]}>{badge.icon}</Text>
                      <Ionicons
                        name="lock-closed"
                        size={16}
                        color={colors.text.primary}
                        style={styles.lockIcon}
                      />
                    </View>
                    <Text style={[styles.badgeName, styles.badgeNameGray]} numberOfLines={1}>
                      {badge.name}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {earnedCount === 0 && (
            <View style={styles.noBadges}>
              <Ionicons name="trophy-outline" size={48} color={colors.text.secondary} />
              <Text style={styles.noBadgesText}>No badges earned yet</Text>
              <Text style={styles.noBadgesHint}>Complete tasks to earn your first badge!</Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(modals)/edit-profile')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={20} color={colors.primary.default} />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border.default} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(modals)/household-members')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="people-outline" size={20} color={colors.primary.default} />
              <Text style={styles.menuItemText}>Family Members</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border.default} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(modals)/household-settings')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="home-outline" size={20} color={colors.primary.default} />
              <Text style={styles.menuItemText}>Household Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border.default} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(modals)/settings')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={20} color={colors.primary.default} />
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border.default} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: colors.text.primary,
  },
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    fontSize: 40,
  },
  name: {
    ...Typography.h3,
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
    gap: 4,
  },
  levelText: {
    ...Typography.labelMedium,
    color: colors.surface.primary,
    fontWeight: '600',
  },
  levelTitle: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.default,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    gap: 4,
  },
  adminText: {
    ...Typography.labelSmall,
    color: colors.surface.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface.primary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    ...Typography.h3,
    color: colors.text.primary,
    marginVertical: Spacing.xs,
  },
  statLabel: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  captainStatsCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    ...Shadows.small,
  },
  captainStatItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  captainStatValue: {
    ...Typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  captainStatLabel: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemText: {
    ...Typography.bodyLarge,
    color: colors.text.primary,
  },
  logoutButton: {
    backgroundColor: colors.error.default,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  logoutButtonText: {
    ...Typography.button,
    color: colors.surface.primary,
  },
  // Badges styles
  badgeCount: {
    ...Typography.bodyLarge,
    color: colors.primary.default,
    fontWeight: '600',
  },
  badgesSubtitle: {
    ...Typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    position: 'relative',
  },
  badgeEarned: {
    backgroundColor: colors.accent.default + '20',
    borderWidth: 2,
    borderColor: colors.accent.default,
  },
  badgeLocked: {
    backgroundColor: colors.surface.tertiary,
    borderWidth: 2,
    borderColor: colors.text.primary,
    opacity: 0.5,
  },
  badgeIconLarge: {
    fontSize: 32,
  },
  badgeIconGray: {
    opacity: 0.6,
  },
  lockIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.surface.primary,
    borderRadius: 8,
    padding: 2,
  },
  badgeName: {
    ...Typography.bodySmall,
    color: colors.text.primary,
    textAlign: 'center',
    fontSize: 11,
  },
  badgeNameGray: {
    color: colors.text.secondary,
  },
  noBadges: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  noBadgesText: {
    ...Typography.bodyLarge,
    color: colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  noBadgesHint: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
