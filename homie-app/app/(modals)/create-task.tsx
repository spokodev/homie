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
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { useCreateTask } from '@/hooks/useTasks';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useMembers } from '@/hooks/useMembers';
import { TextInput } from '@/components/Form/TextInput';
import { TextArea } from '@/components/Form/TextArea';
import { useToast } from '@/components/Toast';
import {
  validateTaskTitle,
  validateTaskDescription,
  validateEstimatedMinutes,
  validateRoomName,
} from '@/utils/validation';
import { trackTaskEvent, ANALYTICS_EVENTS } from '@/utils/analytics';
import { TASK_TEMPLATES, TASK_CATEGORIES, TaskCategoryId } from '@/constants';

export default function CreateTaskModal() {
  const router = useRouter();
  const { household, member } = useHousehold();
  const createTask = useCreateTask();
  const { showToast } = useToast();
  const { data: members = [] } = useMembers(household?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [room, setRoom] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<TaskCategoryId | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    room?: string;
    estimatedMinutes?: string;
    dueDate?: string;
  }>({});

  const calculatePoints = (minutes: string) => {
    const mins = parseInt(minutes) || 0;
    return Math.ceil(mins / 5);
  };

  const handleTemplateSelect = (template: typeof TASK_TEMPLATES[number]) => {
    setTitle(template.title);
    setEstimatedMinutes(template.minutes.toString());
    setCategory(template.category as TaskCategoryId);
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

    // Validate room (optional)
    if (room.trim()) {
      const roomValidation = validateRoomName(room);
      if (!roomValidation.isValid) {
        newErrors.room = roomValidation.error;
      }
    }

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
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        room: room.trim() || undefined,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
        assignee_id: assigneeId || undefined,
        category: category || undefined,
        due_date: dueDate?.toISOString() || undefined,
        household_id: household.id,
        created_by_member_id: member.id,
      });

      // Track task created
      trackTaskEvent(ANALYTICS_EVENTS.TASK_CREATED, {
        points: calculatePoints(estimatedMinutes),
        has_due_date: !!dueDate,
        has_assignee: !!assigneeId,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
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
            <ActivityIndicator size="small" color={Colors.primary} />
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

        {/* Room */}
        <TextInput
          label="Room"
          placeholder="e.g., Kitchen, Living Room"
          value={room}
          onChangeText={(text) => {
            setRoom(text);
            if (errors.room) setErrors({ ...errors, room: undefined });
          }}
          error={errors.room}
          leftIcon="home-outline"
          editable={!createTask.isPending}
          containerStyle={styles.section}
        />

        {/* Estimated Time */}
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
          helperText={
            estimatedMinutes ? `≈ ${calculatePoints(estimatedMinutes)} points` : undefined
          }
          leftIcon="time-outline"
          keyboardType="number-pad"
          editable={!createTask.isPending}
          containerStyle={styles.section}
        />

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
          <Text style={styles.label}>Category (Optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {TASK_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
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
                  onPress={() => setCategory(cat.id)}
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
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
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
                <Ionicons name="close-circle" size={20} color={Colors.gray500} />
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
            Points are calculated automatically based on estimated time: 5 minutes = 1
            point
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
  cancelButton: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  createButton: {
    ...Typography.bodyLarge,
    color: Colors.primary,
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
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  templatesScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  templateCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.gray300,
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
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  templateMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
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
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    marginRight: Spacing.sm,
    minWidth: 80,
  },
  assigneeOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  assigneeAvatar: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  assigneeName: {
    ...Typography.bodySmall,
    color: Colors.text,
    textAlign: 'center',
  },
  assigneeNameSelected: {
    color: Colors.primary,
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
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    marginRight: Spacing.sm,
    minWidth: 90,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  categoryName: {
    ...Typography.bodySmall,
    color: Colors.text,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary + '20',
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
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.gray300,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dateButtonError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  dateButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
  },
  clearButton: {
    padding: Spacing.xs,
  },
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
    marginBottom: Spacing.md,
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
  orText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  dateInput: {
    backgroundColor: Colors.gray300,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    ...Typography.bodyLarge,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...Typography.bodyLarge,
    color: Colors.white,
    fontWeight: '600',
  },
});
