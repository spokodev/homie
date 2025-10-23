import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCompleteTask, useDeleteTask, useUpdateTask, Task } from '@/hooks/useTasks';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/Modal/ConfirmDialog';
import { MemberPermissions } from '@/utils/permissions';
import { TASK_CATEGORIES, TaskCategoryId } from '@/constants';

export default function TaskDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();
  const { household, member } = useHousehold();
  const { showToast } = useToast();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const { data: members = [] } = useMembers(household?.id);
  const [completing, setCompleting] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssigneeDialog, setShowAssigneeDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showDueDateDialog, setShowDueDateDialog] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState<Date | undefined>(undefined);

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

  const handleStartTask = async () => {
    if (!task) return;

    // Check permission
    const permission = MemberPermissions.canCompleteTask(member, task.assignee_id);
    if (!permission.allowed) {
      showToast(permission.reason || 'Cannot start this task', 'error');
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          status: 'in_progress',
        },
      });

      showToast('Task started! 💪', 'success');
      refetch();
    } catch (error: any) {
      showToast(error.message || 'Failed to start task', 'error');
    }
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

  const handleAssignTask = async (assigneeId: string | null) => {
    if (!task) return;

    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          assignee_id: assigneeId || undefined,
        },
      });

      const assignee = members.find((m) => m.id === assigneeId);
      showToast(
        assigneeId ? `Assigned to ${assignee?.name}` : 'Unassigned task',
        'success'
      );
      refetch();
      setShowAssigneeDialog(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to assign task', 'error');
    }
  };

  const handleUpdateCategory = async (categoryId: TaskCategoryId | null) => {
    if (!task) return;

    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          category: categoryId || undefined,
        },
      });

      const category = TASK_CATEGORIES.find((c) => c.id === categoryId);
      showToast(
        categoryId ? `Category updated to ${category?.name}` : 'Category removed',
        'success'
      );
      refetch();
      setShowCategoryDialog(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to update category', 'error');
    }
  };

  const handleUpdateDueDate = async () => {
    if (!task) return;

    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          due_date: editingDueDate?.toISOString() || undefined,
        },
      });

      showToast(
        editingDueDate ? 'Due date updated' : 'Due date removed',
        'success'
      );
      refetch();
      setShowDueDateDialog(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to update due date', 'error');
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
  const isPending = task.status === 'pending';
  const isInProgress = task.status === 'in_progress';
  const canInteract = !task.assignee_id || task.assignee_id === member?.id;

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

        {/* Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category</Text>
            {!isCompleted && (
              <TouchableOpacity onPress={() => setShowCategoryDialog(true)}>
                <Text style={styles.changeButton}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
          {task.category ? (
            (() => {
              const category = TASK_CATEGORIES.find(c => c.id === task.category);
              return category ? (
                <View style={[styles.categoryCard, { backgroundColor: category.color + '20' }]}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[styles.categoryText, { color: category.color }]}>
                    {category.name}
                  </Text>
                </View>
              ) : null;
            })()
          ) : (
            <View style={[styles.assigneeCard, styles.unassignedCard]}>
              <Ionicons name="apps-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.unassignedText}>No category assigned</Text>
            </View>
          )}
        </View>

        {/* Assignee */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned To</Text>
            {!isCompleted && (
              <TouchableOpacity onPress={() => setShowAssigneeDialog(true)}>
                <Text style={styles.changeButton}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
          {task.assignee_name ? (
            <View style={styles.assigneeCard}>
              <Text style={styles.assigneeAvatar}>{task.assignee_avatar || '😊'}</Text>
              <Text style={styles.assigneeName}>{task.assignee_name}</Text>
            </View>
          ) : (
            <View style={[styles.assigneeCard, styles.unassignedCard]}>
              <Text style={styles.assigneeAvatar}>❔</Text>
              <Text style={styles.unassignedText}>Anyone can complete this task</Text>
            </View>
          )}
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Due Date</Text>
            {!isCompleted && (
              <TouchableOpacity
                onPress={() => {
                  setEditingDueDate(task.due_date ? new Date(task.due_date) : undefined);
                  setShowDueDateDialog(true);
                }}
              >
                <Text style={styles.changeButton}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.dateCard}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text style={styles.dateText}>{formatDate(task.due_date)}</Text>
          </View>
        </View>

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
        {/* Start Task button - only for pending tasks */}
        {isPending && canInteract && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTask}
          >
            <Ionicons name="play-circle" size={20} color={Colors.white} />
            <Text style={styles.startButtonText}>Start Task</Text>
          </TouchableOpacity>
        )}

        {/* Complete Task button - only for in_progress tasks */}
        {isInProgress && canInteract && (
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

      {/* Assignee Selection Modal */}
      {showAssigneeDialog && (
        <View style={styles.assigneeModal}>
          <View style={styles.assigneeModalContent}>
            <View style={styles.assigneeModalHeader}>
              <Text style={styles.assigneeModalTitle}>Assign Task</Text>
              <TouchableOpacity onPress={() => setShowAssigneeDialog(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.assigneeList}>
              {/* Unassigned option */}
              <TouchableOpacity
                style={styles.assigneeOption}
                onPress={() => handleAssignTask(null)}
              >
                <Text style={styles.assigneeOptionAvatar}>❔</Text>
                <View style={styles.assigneeOptionInfo}>
                  <Text style={styles.assigneeOptionName}>Anyone</Text>
                  <Text style={styles.assigneeOptionDesc}>Unassigned</Text>
                </View>
                {!task?.assignee_id && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
              </TouchableOpacity>

              {/* Member options */}
              {members.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.assigneeOption}
                  onPress={() => handleAssignTask(m.id)}
                >
                  <Text style={styles.assigneeOptionAvatar}>{m.avatar}</Text>
                  <View style={styles.assigneeOptionInfo}>
                    <Text style={styles.assigneeOptionName}>{m.name}</Text>
                    <Text style={styles.assigneeOptionDesc}>{m.type === 'pet' ? 'Pet' : 'Member'}</Text>
                  </View>
                  {task?.assignee_id === m.id && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Category Selection Modal */}
      {showCategoryDialog && (
        <View style={styles.assigneeModal}>
          <View style={styles.assigneeModalContent}>
            <View style={styles.assigneeModalHeader}>
              <Text style={styles.assigneeModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryDialog(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.assigneeList}>
              {/* No category option */}
              <TouchableOpacity
                style={styles.assigneeOption}
                onPress={() => handleUpdateCategory(null)}
              >
                <Ionicons name="close-circle-outline" size={24} color={Colors.textSecondary} style={{marginRight: 12}} />
                <View style={styles.assigneeOptionInfo}>
                  <Text style={styles.assigneeOptionName}>No Category</Text>
                  <Text style={styles.assigneeOptionDesc}>Remove category</Text>
                </View>
                {!task?.category && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
              </TouchableOpacity>

              {/* Category options */}
              {TASK_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.assigneeOption}
                  onPress={() => handleUpdateCategory(cat.id)}
                >
                  <Text style={{fontSize: 32, marginRight: 12}}>{cat.icon}</Text>
                  <View style={styles.assigneeOptionInfo}>
                    <Text style={styles.assigneeOptionName}>{cat.name}</Text>
                    <View style={[styles.categoryPreview, { backgroundColor: cat.color + '30' }]}>
                      <Text style={[styles.categoryPreviewText, { color: cat.color }]}>
                        {cat.id}
                      </Text>
                    </View>
                  </View>
                  {task?.category === cat.id && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Due Date Edit Modal */}
      {showDueDateDialog && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Set Due Date</Text>
                <TouchableOpacity onPress={() => setShowDueDateDialog(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerContainer}>
                {/* Quick presets */}
                <View style={styles.presetsRow}>
                  <TouchableOpacity
                    style={styles.presetButton}
                    onPress={() => {
                      const date = new Date();
                      date.setHours(date.getHours() + 2);
                      setEditingDueDate(date);
                    }}
                  >
                    <Text style={styles.presetButtonText}>In 2 hours</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetButton}
                    onPress={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 1);
                      date.setHours(9, 0, 0, 0);
                      setEditingDueDate(date);
                    }}
                  >
                    <Text style={styles.presetButtonText}>Tomorrow 9 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetButton}
                    onPress={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 7);
                      setEditingDueDate(date);
                    }}
                  >
                    <Text style={styles.presetButtonText}>Next Week</Text>
                  </TouchableOpacity>
                </View>

                {/* Current selection */}
                <Text style={styles.currentDateLabel}>Selected:</Text>
                <Text style={styles.currentDateText}>
                  {editingDueDate
                    ? editingDueDate.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'No due date'}
                </Text>

                {/* Action buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButtonSecondary}
                    onPress={() => {
                      setEditingDueDate(undefined);
                      handleUpdateDueDate();
                    }}
                  >
                    <Text style={styles.modalButtonSecondaryText}>Remove Date</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButtonPrimary}
                    onPress={handleUpdateDueDate}
                    disabled={!editingDueDate}
                  >
                    <Text style={styles.modalButtonPrimaryText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  changeButton: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
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
  unassignedCard: {
    borderWidth: 2,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
  },
  unassignedText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  assigneeModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  assigneeModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    maxHeight: '80%',
  },
  assigneeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray300,
  },
  assigneeModalTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  assigneeList: {
    maxHeight: 400,
  },
  assigneeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  assigneeOptionAvatar: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  assigneeOptionInfo: {
    flex: 1,
  },
  assigneeOptionName: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: '500',
  },
  assigneeOptionDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  startButtonText: {
    ...Typography.button,
    color: Colors.white,
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
  // Category styles
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  categoryPreview: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  categoryPreviewText: {
    ...Typography.labelSmall,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  // Date picker modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray300,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  datePickerContainer: {
    padding: Spacing.lg,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  presetButton: {
    flex: 1,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  presetButtonText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  currentDateLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  currentDateText: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    ...Typography.button,
    color: Colors.white,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: Colors.gray300,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    ...Typography.button,
    color: Colors.text,
  },
});
