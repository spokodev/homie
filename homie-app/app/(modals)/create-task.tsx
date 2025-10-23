import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    room?: string;
    estimatedMinutes?: string;
  }>({});

  const calculatePoints = (minutes: string) => {
    const mins = parseInt(minutes) || 0;
    return Math.ceil(mins / 5);
  };

  const validateForm = () => {
    const newErrors: {
      title?: string;
      description?: string;
      room?: string;
      estimatedMinutes?: string;
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
      const task = await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        room: room.trim() || undefined,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
        assignee_id: assigneeId || undefined,
        household_id: household.id,
        created_by_member_id: member.id,
      });

      // Track task created
      trackTaskEvent(ANALYTICS_EVENTS.TASK_CREATED, {
        points: calculatePoints(estimatedMinutes),
        has_due_date: false,
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

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Points are calculated automatically based on estimated time: 5 minutes = 1
            point
          </Text>
        </View>
      </ScrollView>
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
    borderBottomColor: Colors.gray200,
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
});
