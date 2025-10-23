import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import {
  useRecurringTasks,
  useToggleRecurringTask,
  useDeleteRecurringTask,
  useGenerateRecurringTaskInstances,
} from '@/hooks/useRecurringTasks';
import { RecurringTask, getRecurrenceDescription } from '@/types/recurrence';
import { TASK_CATEGORIES } from '@/constants';
import { showToast } from '@/components/Toast';
import { format } from 'date-fns';

export default function RecurringTasksScreen() {
  const router = useRouter();
  const { data: recurringTasks = [], isLoading, refetch } = useRecurringTasks();
  const toggleTask = useToggleRecurringTask();
  const deleteTask = useDeleteRecurringTask();
  const generateInstances = useGenerateRecurringTaskInstances();

  const handleToggle = async (task: RecurringTask) => {
    try {
      await toggleTask.mutateAsync({
        id: task.id,
        isActive: !task.is_active,
      });
      showToast(
        task.is_active ? 'Recurring task paused' : 'Recurring task activated',
        'success'
      );
    } catch (error: any) {
      showToast(error.message || 'Failed to update recurring task', 'error');
    }
  };

  const handleDelete = (task: RecurringTask) => {
    Alert.alert(
      'Delete Recurring Task',
      `Are you sure you want to delete "${task.title}"? This will not delete already created tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask.mutateAsync(task.id);
              showToast('Recurring task deleted', 'success');
            } catch (error: any) {
              showToast(error.message || 'Failed to delete recurring task', 'error');
            }
          },
        },
      ]
    );
  };

  const handleGenerateNow = async () => {
    try {
      const result = await generateInstances.mutateAsync();
      if (result.generated > 0) {
        showToast(`Generated ${result.generated} task(s)`, 'success');
        refetch();
      } else {
        showToast('No tasks due for generation', 'info');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to generate tasks', 'error');
    }
  };

  const renderRecurringTask = ({ item }: { item: RecurringTask }) => {
    const category = TASK_CATEGORIES.find((c) => c.id === item.category);
    const nextOccurrence = item.next_occurrence_at ? new Date(item.next_occurrence_at) : null;
    const lastGenerated = item.last_generated_at ? new Date(item.last_generated_at) : null;

    return (
      <View style={[styles.taskCard, !item.is_active && styles.taskCardInactive]}>
        {/* Header */}
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            {category && (
              <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
              </View>
            )}
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, !item.is_active && styles.taskTitleInactive]}>
                {item.title}
              </Text>
              <Text style={styles.recurrenceText}>
                {getRecurrenceDescription(item.recurrence_rule)}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleToggle(item)} style={styles.toggleButton}>
            <Ionicons
              name={item.is_active ? 'pause' : 'play'}
              size={20}
              color={item.is_active ? Colors.warning : Colors.success}
            />
          </TouchableOpacity>
        </View>

        {/* Details */}
        <View style={styles.taskDetails}>
          {item.estimated_minutes && (
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{item.estimated_minutes} min</Text>
            </View>
          )}
          {item.points && (
            <View style={styles.detailItem}>
              <Ionicons name="star-outline" size={16} color={Colors.accent} />
              <Text style={styles.detailText}>{item.points} pts</Text>
            </View>
          )}
          {nextOccurrence && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              <Text style={styles.detailText}>
                Next: {format(nextOccurrence, 'MMM d, h:mm a')}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            Generated: {item.total_occurrences} time{item.total_occurrences !== 1 ? 's' : ''}
          </Text>
          {lastGenerated && (
            <Text style={styles.statsText}>
              Last: {format(lastGenerated, 'MMM d')}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={[styles.actionButtonText, { color: Colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recurring Tasks</Text>
        <TouchableOpacity onPress={() => router.push('/(modals)/create-recurring-task')}>
          <Ionicons name="add" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Generate Now Button */}
      {recurringTasks.length > 0 && (
        <View style={styles.generateSection}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateNow}
            disabled={generateInstances.isPending}
          >
            <Ionicons name="refresh-outline" size={20} color={Colors.white} />
            <Text style={styles.generateButtonText}>
              {generateInstances.isPending ? 'Generating...' : 'Generate Due Tasks Now'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.generateHint}>
            Automatically creates tasks that are due based on their schedule
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : recurringTasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="repeat-outline" size={80} color={Colors.gray300} />
          <Text style={styles.emptyTitle}>No Recurring Tasks</Text>
          <Text style={styles.emptyText}>
            Create recurring tasks to automate repetitive chores
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(modals)/create-recurring-task')}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.createButtonText}>Create Recurring Task</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recurringTasks}
          renderItem={renderRecurringTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  generateSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray300,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
  },
  generateButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  generateHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  createButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.md,
  },
  taskCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardInactive: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.sm,
  },
  categoryBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...Typography.labelLarge,
    color: Colors.text,
    marginBottom: 2,
  },
  taskTitleInactive: {
    textDecorationLine: 'line-through',
  },
  recurrenceText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  toggleButton: {
    padding: Spacing.xs,
  },
  taskDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray300,
    marginBottom: Spacing.sm,
  },
  statsText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
