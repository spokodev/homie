import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography, Spacing, BorderRadius, Shadows } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useMyTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useTasksRealtime, useMembersRealtime } from '@/hooks/useRealtimeSubscription';
import { useMembers } from '@/hooks/useMembers';
import { useCaptain } from '@/hooks/useCaptain';
import { TASK_CATEGORIES, TaskCategoryId } from '@/constants';
import { NetworkErrorView } from '@/components/NetworkErrorView';
import { SkeletonCard, SkeletonList } from '@/components/Skeleton';
import { AnimatedFAB } from '@/components/AnimatedButton';

type SortOption = 'due_date' | 'points' | 'alphabetical';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useAuth();
  const { household, member } = useHousehold();
  const { data: tasks = [], isLoading, refetch, isRefetching, error, isError } = useMyTasks(
    household?.id,
    member?.id
  );
  const { data: allMembers = [] } = useMembers(household?.id);
  const { data: captain, isLoading: captainLoading } = useCaptain(household?.id);

  // Filter and sort states
  const [selectedCategory, setSelectedCategory] = useState<TaskCategoryId | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('due_date');

  const styles = createStyles(colors);

  // Real-time subscriptions
  useTasksRealtime(household?.id);
  useMembersRealtime(household?.id);

  // Calculate member stats
  const stats = {
    points: member?.points || 0,
    streak: member?.streak_days || 0,
    rank: member ? allMembers.findIndex(m => m.id === member.id) + 1 : 0,
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    // Sort tasks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'points':
          return (b.points || 0) - (a.points || 0);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, selectedCategory, sortBy]);

  // Check for overdue tasks
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(task => task.due_date && new Date(task.due_date) < now);
  }, [tasks]);

  const handleCreateTask = () => {
    router.push('/(modals)/create-task');
  };

  const handleRateCaptain = () => {
    if (!captain || !household || !member) return;
    router.push(
      `/(modals)/rate-captain?captainId=${captain.id}&captainName=${captain.name}&rotationStart=${captain.started_at}&rotationEnd=${captain.ends_at}`
    );
  };

  const getTaskIcon = (room?: string) => {
    const icons: Record<string, string> = {
      Kitchen: '🍳',
      'Living Room': '🛋️',
      Bedroom: '🛏️',
      Bathroom: '🚿',
      Garden: '🌱',
    };
    return icons[room || ''] || '📋';
  };

  const formatTime = (dueDate?: string) => {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>✅</Text>
      <Text style={styles.emptyTitle}>No tasks yet!</Text>
      <Text style={styles.emptyText}>
        Tap the + button below to create your first task
      </Text>
    </View>
  );

  // Show error state with retry option
  if (isError && !isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <NetworkErrorView
          onRetry={() => refetch()}
          message="Failed to load your tasks"
          retrying={isRefetching}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back! 👋</Text>
            <Text style={styles.householdName}>
              {household?.name || 'Loading...'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(modals)/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Captain Card */}
        {captainLoading ? (
          <View style={[styles.captainCard, styles.captainCardLoading]}>
            <ActivityIndicator size="small" color={colors.primary.default} />
            <Text style={styles.captainLoadingText}>Loading captain...</Text>
          </View>
        ) : captain ? (
          <View style={styles.captainCard}>
            <View style={styles.captainBadge}>
              <MaterialCommunityIcons name="crown" size={20} color={colors.accent.default} />
            </View>
            <View style={styles.captainInfo}>
              <Text style={styles.captainTitle}>Captain of the Week</Text>
              <View style={styles.captainDetails}>
                <Text style={styles.captainAvatar}>{captain.avatar}</Text>
                <View>
                  <Text style={styles.captainName}>{captain.name}</Text>
                  <Text style={styles.captainDays}>
                    {captain.days_left} day{captain.days_left !== 1 ? 's' : ''} left
                  </Text>
                  {captain.average_rating && (
                    <View style={styles.captainRating}>
                      <Ionicons name="star" size={12} color={colors.accent.default} />
                      <Text style={styles.captainRatingText}>
                        {captain.average_rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.rateButton}
              onPress={handleRateCaptain}
              disabled={captain.id === member?.id}
            >
              <Text
                style={[
                  styles.rateButtonText,
                  captain.id === member?.id && styles.rateButtonTextDisabled,
                ]}
              >
                {captain.id === member?.id ? 'You' : 'Rate'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.captainCard, styles.captainCardEmpty]}>
            <MaterialCommunityIcons name="crown-outline" size={32} color={colors.text.secondary} />
            <Text style={styles.captainEmptyText}>No captain assigned yet</Text>
          </View>
        )}

        {/* My Tasks Today */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Tasks</Text>
            <TouchableOpacity onPress={handleCreateTask}>
              <Text style={styles.seeAllButton}>+ New</Text>
            </TouchableOpacity>
          </View>

          {/* Overdue Badge */}
          {overdueTasks.length > 0 && (
            <View style={styles.overdueContainer}>
              <View style={styles.overdueBadge}>
                <Ionicons name="alert-circle" size={16} color={colors.error.default} />
                <Text style={styles.overdueText}>
                  {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}

          {/* Category Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'all' && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {TASK_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterChip,
                  selectedCategory === category.id && styles.filterChipActive,
                  selectedCategory === category.id && { borderColor: category.color },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.filterChipIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === category.id && styles.filterChipTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'due_date' && styles.sortButtonActive]}
              onPress={() => setSortBy('due_date')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'due_date' && styles.sortButtonTextActive,
                ]}
              >
                Due Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'points' && styles.sortButtonActive]}
              onPress={() => setSortBy('points')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'points' && styles.sortButtonTextActive,
                ]}
              >
                Points
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'alphabetical' && styles.sortButtonActive]}
              onPress={() => setSortBy('alphabetical')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'alphabetical' && styles.sortButtonTextActive,
                ]}
              >
                A-Z
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
              <SkeletonList count={3} />
            </View>
          ) : filteredAndSortedTasks.length === 0 ? (
            selectedCategory !== 'all' ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No tasks in this category</Text>
                <Text style={styles.emptyText}>
                  Try selecting a different category or create a new task
                </Text>
              </View>
            ) : (
              renderEmptyState()
            )
          ) : (
            filteredAndSortedTasks.map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              const category = TASK_CATEGORIES.find(c => c.id === task.category);
              return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskCard,
                  isOverdue && styles.taskCardOverdue,
                ]}
                onPress={() => router.push(`/(modals)/task-details?taskId=${task.id}`)}
              >
                <Text style={styles.taskIcon}>{category?.icon || getTaskIcon(task.room)}</Text>
                <View style={styles.taskInfo}>
                  <View style={styles.taskTitleRow}>
                    <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
                    {task.recurring_task_id && (
                      <View style={styles.recurringIndicator}>
                        <Ionicons name="repeat" size={14} color={colors.secondary.default} />
                      </View>
                    )}
                    {isOverdue && (
                      <View style={styles.overdueIndicator}>
                        <Ionicons name="alert-circle" size={14} color={colors.error.default} />
                      </View>
                    )}
                  </View>
                  <View style={styles.taskMeta}>
                    {category && (
                      <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                        <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                          {category.name}
                        </Text>
                      </View>
                    )}
                    {task.room && (
                      <Text style={styles.taskRoom}>{task.room}</Text>
                    )}
                    {task.due_date && (
                      <Text style={[styles.taskTime, isOverdue && styles.taskTimeOverdue]}>
                        {formatTime(task.due_date)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.taskPoints}>
                  <Text style={styles.taskPointsText}>{task.points} pts</Text>
                </View>
              </TouchableOpacity>
            );
            })
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={20} color={colors.accent.default} />
            <Text style={styles.statValue}>{stats.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={20} color={colors.warning.default} />
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={20} color={colors.primary.default} />
            <Text style={styles.statValue}>#{stats.rank || '-'}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <AnimatedFAB
        icon={<Ionicons name="add" size={28} color={colors.text.inverse} />}
        onPress={handleCreateTask}
        accessibilityLabel="Create new task"
        accessibilityHint="Opens the create task modal"
        style={{
          position: 'absolute',
          bottom: 100,
          right: Spacing.lg,
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  greeting: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
  },
  householdName: {
    ...Typography.h3,
    color: colors.text.primary,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  captainCard: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.large,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    ...Shadows.medium,
  },
  captainBadge: {
    position: 'absolute',
    top: -8,
    left: Spacing.md,
    backgroundColor: colors.primary.default,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  captainInfo: {
    flex: 1,
  },
  captainTitle: {
    ...Typography.labelSmall,
    color: colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  captainDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  captainAvatar: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  captainName: {
    ...Typography.bodyLarge,
    color: colors.text.primary,
    fontWeight: '600',
  },
  captainDays: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
  },
  captainRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  captainRatingText: {
    ...Typography.labelSmall,
    color: colors.accent.default,
    marginLeft: 2,
  },
  captainCardLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  captainLoadingText: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: Spacing.sm,
  },
  captainCardEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    gap: Spacing.sm,
  },
  captainEmptyText: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
  },
  rateButton: {
    backgroundColor: colors.secondary.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  rateButtonText: {
    ...Typography.labelMedium,
    color: colors.text.inverse,
  },
  rateButtonTextDisabled: {
    opacity: 0.6,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: colors.text.primary,
  },
  seeAllButton: {
    ...Typography.bodyMedium,
    color: colors.primary.default,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h4,
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  taskCard: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  taskIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...Typography.bodyLarge,
    color: colors.text.primary,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  taskRoom: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
    marginRight: Spacing.sm,
  },
  taskTime: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
  },
  taskPoints: {
    backgroundColor: colors.accent.subtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
  },
  taskPointsText: {
    ...Typography.labelSmall,
    color: colors.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  statCard: {
    backgroundColor: colors.surface.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.xs,
    ...Shadows.small,
  },
  statValue: {
    ...Typography.h4,
    color: colors.text.primary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.labelSmall,
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.lg,
    backgroundColor: colors.primary.default,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
  // Filters and Sorting
  overdueContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.subtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  overdueText: {
    ...Typography.labelMedium,
    color: colors.error.default,
    fontWeight: '600',
  },
  filtersScroll: {
    marginBottom: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.primary,
    gap: Spacing.xs,
  },
  filterChipActive: {
    borderColor: colors.primary.default,
    backgroundColor: colors.primary.subtle,
  },
  filterChipIcon: {
    fontSize: 16,
  },
  filterChipText: {
    ...Typography.bodyMedium,
    color: colors.text.primary,
  },
  filterChipTextActive: {
    color: colors.primary.default,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sortLabel: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
  },
  sortButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
    backgroundColor: colors.border.default,
  },
  sortButtonActive: {
    backgroundColor: colors.secondary.default,
  },
  sortButtonText: {
    ...Typography.labelSmall,
    color: colors.text.primary,
  },
  sortButtonTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  // Task Card Enhancements
  taskCardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: colors.error.default,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  recurringIndicator: {
    marginLeft: Spacing.xs,
  },
  overdueIndicator: {
    marginLeft: Spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
    marginRight: Spacing.xs,
  },
  categoryBadgeText: {
    ...Typography.labelSmall,
    fontWeight: '600',
  },
  taskTimeOverdue: {
    color: colors.error.default,
    fontWeight: '600',
  },
});
