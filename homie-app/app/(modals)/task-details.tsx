import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCompleteTask, useDeleteTask, Task } from '@/hooks/useTasks';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/Modal/ConfirmDialog';
import { MemberPermissions } from '@/utils/permissions';

export default function TaskDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();
  const { member } = useHousehold();
  const { showToast } = useToast();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const [completing, setCompleting] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch task details
  const { data: task, isLoading, refetch } = useQuery<Task>({
    queryKey: ['task', params.taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:members!tasks_assignee_id_fkey(
            id,
            name,
            avatar
          ),
          creator:members!tasks_created_by_fkey(
            id,
            name,
            avatar
          )
        `)
        .eq('id', params.taskId)
        .single();

      if (error) throw error;
      return {
        ...data,
        assignee_name: data.assignee?.name,
        assignee_avatar: data.assignee?.avatar,
      };
    },
    enabled: !!params.taskId,
  });

  const handleEdit = () => {
    // Check permission
    const permission = MemberPermissions.canEditTask(member, task?.created_by);
    if (!permission.allowed) {
      showToast(permission.reason || 'Cannot edit this task', 'error');
      return;
    }
    router.push(`/(modals)/edit-task?taskId=${params.taskId}`);
  };

  const handleComplete = async () => {
    if (!task) return;

    // Check permission
    const permission = MemberPermissions.canCompleteTask(member, task.assignee_id);
    if (!permission.allowed) {
      showToast(permission.reason || 'Cannot complete this task', 'error');
      return;
    }

    setCompleting(true);
    try {
      await completeTask.mutateAsync({
        taskId: task.id,
        actualMinutes: task.estimated_minutes,
      });

      showToast(`+${task.points} points earned! 🎉`, 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to complete task', 'error');
    } finally {
      setCompleting(false);
      setShowCompleteDialog(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    // Check permission
    const permission = MemberPermissions.canDeleteTask(member, task.created_by);
    if (!permission.allowed) {
      showToast(permission.reason || 'Cannot delete this task', 'error');
      return;
    }

    try {
      await deleteTask.mutateAsync(task.id);
      showToast('Task deleted', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete task', 'error');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'in_progress':
        return Colors.warning;
      default:
        return Colors.gray400;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Pending';
    }
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

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Task not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = task.status === 'completed';
  const canComplete = !isCompleted && (!task.assignee_id || task.assignee_id === member?.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <TouchableOpacity onPress={handleEdit} disabled={isCompleted}>
          <Ionicons
            name="pencil"
            size={24}
            color={isCompleted ? Colors.gray400 : Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title & Status */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{task.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
              {getStatusLabel(task.status)}
            </Text>
          </View>
        </View>

        {/* Description */}
        {task.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{task.description}</Text>
          </View>
        )}

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {/* Points */}
          <View style={styles.detailCard}>
            <Ionicons name="star" size={20} color={Colors.accent} />
            <Text style={styles.detailValue}>{task.points}</Text>
            <Text style={styles.detailLabel}>Points</Text>
          </View>

          {/* Time */}
          <View style={styles.detailCard}>
            <Ionicons name="time" size={20} color={Colors.secondary} />
            <Text style={styles.detailValue}>{task.estimated_minutes || '-'}</Text>
            <Text style={styles.detailLabel}>Minutes</Text>
          </View>

          {/* Room */}
          <View style={styles.detailCard}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={styles.detailValue}>{task.room || '🏠'}</Text>
            <Text style={styles.detailLabel}>Room</Text>
          </View>
        </View>

        {/* Assignee */}
        {task.assignee_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned To</Text>
            <View style={styles.assigneeCard}>
              <Text style={styles.assigneeAvatar}>{task.assignee_avatar || '😊'}</Text>
              <Text style={styles.assigneeName}>{task.assignee_name}</Text>
            </View>
          </View>
        )}

        {/* Due Date */}
        {task.due_date && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Due Date</Text>
            <View style={styles.dateCard}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.dateText}>{formatDate(task.due_date)}</Text>
            </View>
          </View>
        )}

        {/* Completion Info */}
        {isCompleted && (
          <View style={styles.completionCard}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.completionText}>
              Completed on {formatDate(task.completed_at)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {canComplete && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => setShowCompleteDialog(true)}
            disabled={completing}
          >
            {completing ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.completeButtonText}>Complete Task</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteDialog(true)}>
          <Ionicons name="trash" size={20} color={Colors.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        visible={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        onConfirm={handleComplete}
        title="Complete Task"
        message={`You'll earn ${task?.points} points for completing this task!`}
        confirmText="Complete"
        icon="checkmark-circle"
        loading={completing}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        icon="trash"
        loading={deleteTask.isPending}
      />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.h4,
    color: Colors.error,
    marginBottom: Spacing.lg,
  },
  backButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.white,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.labelMedium,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.labelLarge,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  detailCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailValue: {
    ...Typography.h3,
    color: Colors.text,
    marginVertical: Spacing.xs,
  },
  detailLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  assigneeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  assigneeAvatar: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  assigneeName: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: '500',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    ...Typography.bodyLarge,
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  completionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  completionText: {
    ...Typography.bodyLarge,
    color: Colors.success,
    marginLeft: Spacing.md,
    fontWeight: '600',
  },
  actionsContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    gap: Spacing.sm,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  completeButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing.sm,
  },
  deleteButtonText: {
    ...Typography.button,
    color: Colors.error,
  },
});
