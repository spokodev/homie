import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useCreateTask } from '@/hooks/useTasks';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useMembers } from '@/hooks/useMembers';
import { useRooms } from '@/hooks/useRooms';
import { TextInput } from '@/components/Form/TextInput';
import { TextArea } from '@/components/Form/TextArea';
import { RoomMultiSelectPicker } from '@/components/Form/RoomMultiSelectPicker';
import { useToast } from '@/components/Toast';
import {
  validateTaskTitle,
  validateTaskDescription,
  validateEstimatedMinutes,
  validateRoomName,
} from '@/utils/validation';
import { trackTaskEvent, ANALYTICS_EVENTS } from '@/utils/analytics';
import { TASK_TEMPLATES } from '@/constants';
import { useTaskCategories } from '@/hooks/useTaskCategories';
import { ManageCategoriesModal } from '@/components/Categories';
import { SubtasksManager } from '@/components/Subtasks';

export default function CreateTaskModal() {
  const router = useRouter();
  const colors = useThemeColors();
  const { household, member } = useHousehold();
  const createTask = useCreateTask();
  const { showToast } = useToast();
  const { data: members = [] } = useMembers(household?.id);
  const { data: categories = [] } = useTaskCategories();
  const { data: rooms = [] } = useRooms(household?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [points, setPoints] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);

  const styles = createStyles(colors);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    room?: string;
    estimatedMinutes?: string;
    points?: string;
    dueDate?: string;
  }>({});

  const handleTemplateSelect = (template: typeof TASK_TEMPLATES[number]) => {
    setTitle(template.title);
    setEstimatedMinutes(template.minutes.toString());
    setPoints(template.points.toString()); // Set points from template
    // Note: template.category would need to be mapped to category_id if we have predefined categories
    // For now, leaving categoryId unset when using templates
    setDescription(template.description || '');
    // Templates don't have roomIds, keep current selection
    // Clear errors
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: {
      title?: string;
      description?: string;
      room?: string;
      estimatedMinutes?: string;
      dueDate?: string;
    } = {};

    // Validate title
    const titleValidation = validateTaskTitle(title);
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.error;
    }

    // Validate description (optional)
    if (description.trim()) {
      const descValidation = validateTaskDescription(description);
      if (!descValidation.isValid) {
        newErrors.description = descValidation.error;
      }
    }

    // Room validation not needed - using room picker with existing rooms

    // Validate estimated minutes (optional)
    if (estimatedMinutes.trim()) {
      const minutesValidation = validateEstimatedMinutes(estimatedMinutes);
      if (!minutesValidation.isValid) {
        newErrors.estimatedMinutes = minutesValidation.error;
      }
    }

    // Validate due date (optional, but cannot be in the past)
    if (dueDate) {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // Allow 5 min buffer
      if (dueDate < fiveMinutesAgo) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    if (!household || !member) {
      showToast('No household or member found. Please complete onboarding.', 'error');
      return;
    }

    try {
      // Get points from subtasks or manual input
      let taskPoints = 10; // Default points
      if (subtasks.length > 0) {
        taskPoints = subtasks.reduce((sum, s) => sum + s.points, 0);
      } else if (points) {
        taskPoints = parseInt(points);
      }

      // Get room name from selected room ID
      const selectedRoom = selectedRoomIds.length > 0
        ? rooms.find(r => r.id === selectedRoomIds[0])
        : undefined;

      // Create the task
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        room: selectedRoom?.name || undefined, // Store room name, not ID
        estimated_minutes: subtasks.length > 0 ? undefined : (estimatedMinutes ? parseInt(estimatedMinutes) : undefined),
        points: taskPoints,
        assignee_id: assigneeId || undefined,
        category_id: categoryId || undefined,
        due_date: dueDate?.toISOString() || undefined,
        household_id: household.id,
        created_by_member_id: member.id,
        has_subtasks: subtasks.length > 0,
        subtasks: subtasks, // Pass subtasks to be created
      });

      // Track task created
      trackTaskEvent(ANALYTICS_EVENTS.TASK_CREATED, {
        points: taskPoints,
        has_due_date: !!dueDate,
        has_assignee: !!assigneeId,
      });

      showToast('Task created successfully!', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to create task', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Task</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={createTask.isPending}
        >
          {createTask.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.createButton}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick Templates</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.templatesScroll}
          >
            {TASK_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => handleTemplateSelect(template)}
                disabled={createTask.isPending}
              >
                <Text style={styles.templateIcon}>{template.icon}</Text>
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateMeta}>
                  {template.minutes} min • {template.points} pts
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Title */}
        <TextInput
          label="Title"
          placeholder="e.g., Clean the kitchen"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (errors.title) setErrors({ ...errors, title: undefined });
          }}
          error={errors.title}
          required
          autoFocus
          editable={!createTask.isPending}
          containerStyle={styles.section}
        />

        {/* Description */}
        <TextArea
          label="Description"
          placeholder="Add details..."
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            if (errors.description) setErrors({ ...errors, description: undefined });
          }}
          error={errors.description}
          numberOfLines={4}
          maxLength={500}
          showCounter
          editable={!createTask.isPending}
          containerStyle={styles.section}
        />

        {/* Subtasks */}
        <View style={styles.section}>
          <SubtasksManager
            subtasks={subtasks}
            onChange={setSubtasks}
            disabled={createTask.isPending}
          />
        </View>

        {/* Room */}
        <RoomMultiSelectPicker
          label="Room (Optional)"
          value={selectedRoomIds}
          onChange={setSelectedRoomIds}
          householdId={household?.id || ''}
          placeholder="Select room"
          multiple={false}
          disabled={createTask.isPending}
          containerStyle={styles.section}
        />

        {/* Estimated Time - Only show if no subtasks */}
        {subtasks.length === 0 && (
          <TextInput
            label="Estimated Time (minutes)"
            placeholder="e.g., 30"
            value={estimatedMinutes}
            onChangeText={(text) => {
              setEstimatedMinutes(text);
              if (errors.estimatedMinutes)
                setErrors({ ...errors, estimatedMinutes: undefined });
            }}
            error={errors.estimatedMinutes}
            leftIcon="time-outline"
            keyboardType="number-pad"
            editable={!createTask.isPending}
            containerStyle={styles.section}
          />
        )}

        {/* Points - Show calculated value when subtasks exist, otherwise allow input */}
        {subtasks.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.calculatedPointsContainer}>
              <Ionicons name="star" size={24} color={colors.accent} />
              <View style={styles.calculatedPointsInfo}>
                <Text style={styles.calculatedPointsLabel}>Total Points</Text>
                <Text style={styles.calculatedPointsValue}>
                  {subtasks.reduce((sum, s) => sum + s.points, 0)} points
                </Text>
                <Text style={styles.calculatedPointsHelper}>
                  Calculated from subtasks
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <TextInput
            label="Points"
            placeholder="e.g., 10"
            value={points}
            onChangeText={(text) => {
              setPoints(text);
              if (errors.points)
                setErrors({ ...errors, points: undefined });
            }}
            error={errors.points}
            helperText="Points awarded when task is completed"
            leftIcon="star-outline"
            keyboardType="number-pad"
            editable={!createTask.isPending}
            containerStyle={styles.section}
          />
        )}

        {/* Assign To */}
        <View style={styles.section}>
          <Text style={styles.label}>Assign To (Optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.assigneeScroll}
          >
            {/* Unassigned option */}
            <TouchableOpacity
              style={[
                styles.assigneeOption,
                assigneeId === undefined && styles.assigneeOptionSelected,
              ]}
              onPress={() => setAssigneeId(undefined)}
              disabled={createTask.isPending}
            >
              <Text style={styles.assigneeAvatar}>❔</Text>
              <Text
                style={[
                  styles.assigneeName,
                  assigneeId === undefined && styles.assigneeNameSelected,
                ]}
              >
                Anyone
              </Text>
            </TouchableOpacity>

            {/* Member options */}
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.assigneeOption,
                  assigneeId === m.id && styles.assigneeOptionSelected,
                ]}
                onPress={() => setAssigneeId(m.id)}
                disabled={createTask.isPending}
              >
                <Text style={styles.assigneeAvatar}>{m.avatar}</Text>
                <Text
                  style={[
                    styles.assigneeName,
                    assigneeId === m.id && styles.assigneeNameSelected,
                  ]}
                >
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Category (Optional)</Text>
            {member?.role === 'admin' && (
              <TouchableOpacity onPress={() => setShowCategoriesModal(true)}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    isSelected && {
                      borderColor: cat.color,
                      backgroundColor: cat.color + '15',
                    },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                  disabled={createTask.isPending}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && { color: cat.color, fontWeight: '600' },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Due Date (Optional)</Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.dueDate && styles.dateButtonError]}
            onPress={() => setShowDatePicker(true)}
            disabled={createTask.isPending}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.dateButtonText}>
              {dueDate
                ? dueDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Select Date & Time'}
            </Text>
            {dueDate && (
              <TouchableOpacity
                onPress={() => {
                  setDueDate(undefined);
                  setErrors({ ...errors, dueDate: undefined });
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {errors.dueDate && (
            <Text style={styles.errorText}>{errors.dueDate}</Text>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            {subtasks.length > 0
              ? 'Points are calculated from the sum of all subtask points'
              : 'Enter points manually to reward task completion (default: 10 points)'}
          </Text>
        </View>
      </ScrollView>

      {/* Date Time Picker Modal */}
      {showDatePicker && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Due Date & Time</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
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
                      setDueDate(date);
                      setShowDatePicker(false);
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
                      setDueDate(date);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.presetButtonText}>Tomorrow 9 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetButton}
                    onPress={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 7);
                      setDueDate(date);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.presetButtonText}>Next Week</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.orText}>or pick custom date</Text>

                {/* Simple date input */}
                <RNTextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD HH:MM"
                  value={dueDate?.toISOString().slice(0, 16).replace('T', ' ') || ''}
                  editable={false}
                />

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Categories Modal */}
      <ManageCategoriesModal
        visible={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        onCategorySelected={(id) => {
          setCategoryId(id);
          setShowCategoriesModal(false);
        }}
      />
    </SafeAreaView>
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
    borderBottomColor: colors.border,
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
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  templatesScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  templateCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: colors.border,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    minWidth: 100,
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  templateTitle: {
    ...Typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  templateMeta: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  label: {
    ...Typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  assigneeScroll: {
    marginTop: Spacing.xs,
  },
  assigneeOption: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  assigneeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  assigneeAvatar: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  assigneeName: {
    ...Typography.bodySmall,
    color: colors.text,
    textAlign: 'center',
  },
  assigneeNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  categoryScroll: {
    marginTop: Spacing.xs,
  },
  categoryOption: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: Spacing.sm,
    minWidth: 90,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  categoryName: {
    ...Typography.bodySmall,
    color: colors.text,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary + '20',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  infoText: {
    ...Typography.bodyMedium,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dateButtonError: {
    borderColor: colors.error,
  },
  errorText: {
    ...Typography.bodySmall,
    color: colors.error,
    marginTop: Spacing.xs,
  },
  dateButtonText: {
    ...Typography.bodyMedium,
    color: colors.text,
    flex: 1,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  calculatedPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.md,
  },
  calculatedPointsInfo: {
    flex: 1,
  },
  calculatedPointsLabel: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  calculatedPointsValue: {
    ...Typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  calculatedPointsHelper: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
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
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...Typography.h4,
    color: colors.text,
  },
  datePickerContainer: {
    padding: Spacing.lg,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetButton: {
    flex: 1,
    backgroundColor: colors.primary + '15',
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  presetButtonText: {
    ...Typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  orText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  dateInput: {
    backgroundColor: colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    ...Typography.bodyLarge,
    color: colors.text,
    marginBottom: Spacing.lg,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...Typography.bodyLarge,
    color: colors.card,
    fontWeight: '600',
  },
});
