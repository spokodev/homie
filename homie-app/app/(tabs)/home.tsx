import React from 'react';
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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/theme';
import { useMyTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';

// TODO: Replace with actual household ID from context
const TEMP_HOUSEHOLD_ID = 'temp-household-id';

// Dummy captain data (will be implemented in EPIC 7)
const currentCaptain = {
  name: 'Mom',
  avatar: '👩',
  daysLeft: 3,
};

// Dummy stats (will be implemented in EPIC 9)
const stats = {
  points: 0,
  streak: 0,
  rank: 0,
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: tasks = [], isLoading, refetch, isRefetching } = useMyTasks(TEMP_HOUSEHOLD_ID);

  const handleCreateTask = () => {
    router.push('/(modals)/create-task');
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
              {user?.user_metadata?.full_name || 'User'}
            </Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Captain Card */}
        <View style={styles.captainCard}>
          <View style={styles.captainBadge}>
            <MaterialCommunityIcons name="crown" size={20} color={Colors.accent} />
          </View>
          <View style={styles.captainInfo}>
            <Text style={styles.captainTitle}>Captain of the Week</Text>
            <View style={styles.captainDetails}>
              <Text style={styles.captainAvatar}>{currentCaptain.avatar}</Text>
              <View>
                <Text style={styles.captainName}>{currentCaptain.name}</Text>
                <Text style={styles.captainDays}>{currentCaptain.daysLeft} days left</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.rateButton}>
            <Text style={styles.rateButtonText}>Rate</Text>
          </TouchableOpacity>
        </View>

        {/* My Tasks Today */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Tasks</Text>
            <TouchableOpacity onPress={handleCreateTask}>
              <Text style={styles.seeAllButton}>+ New</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : tasks.length === 0 ? (
            renderEmptyState()
          ) : (
            tasks.map((task) => (
              <TouchableOpacity key={task.id} style={styles.taskCard}>
                <Text style={styles.taskIcon}>{getTaskIcon(task.room)}</Text>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskMeta}>
                    {task.room && (
                      <Text style={styles.taskRoom}>{task.room}</Text>
                    )}
                    {task.due_date && (
                      <Text style={styles.taskTime}>{formatTime(task.due_date)}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.taskPoints}>
                  <Text style={styles.taskPointsText}>{task.points} pts</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={20} color={Colors.accent} />
            <Text style={styles.statValue}>{stats.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={20} color={Colors.warning} />
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>#{stats.rank || '-'}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateTask}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.textSecondary,
  },
  householdName: {
    ...Typography.h3,
    color: Colors.text,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  captainCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.large,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.medium,
  },
  captainBadge: {
    position: 'absolute',
    top: -8,
    left: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  captainInfo: {
    flex: 1,
  },
  captainTitle: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
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
    color: Colors.text,
    fontWeight: '600',
  },
  captainDays: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  rateButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  rateButtonText: {
    ...Typography.labelMedium,
    color: Colors.white,
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
    color: Colors.text,
  },
  seeAllButton: {
    ...Typography.bodyMedium,
    color: Colors.primary,
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
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  taskCard: {
    backgroundColor: Colors.white,
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
    color: Colors.text,
    fontWeight: '500',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  taskRoom: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  taskTime: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  taskPoints: {
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
  },
  taskPointsText: {
    ...Typography.labelSmall,
    color: Colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  statCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.xs,
    ...Shadows.small,
  },
  statValue: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
});
