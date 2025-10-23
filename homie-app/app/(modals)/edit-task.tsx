import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUpdateTask, Task } from '@/hooks/useTasks';
import { TextInput } from '@/components/Form/TextInput';
import { TextArea } from '@/components/Form/TextArea';
import { useToast } from '@/components/Toast';
import {
  validateTaskTitle,
  validateTaskDescription,
  validateEstimatedMinutes,
  validateRoomName,
} from '@/utils/validation';

export default function EditTaskModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();
  const updateTask = useUpdateTask();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [room, setRoom] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    room?: string;
    estimatedMinutes?: string;
  }>({});

  // Fetch task details
  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ['task', params.taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', params.taskId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!params.taskId,
  });

  // Populate form when task loads
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setRoom(task.room || '');
      setEstimatedMinutes(task.estimated_minutes?.toString() || '');
    }
  }, [task]);

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

  const handleUpdate = async () => {
    if (!validateForm()) return;
    if (!task) return;

    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          title: title.trim(),
          description: description.trim() || undefined,
          room: room.trim() || undefined,
          estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
        },
      });

      showToast('Task updated successfully!', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to update task', 'error');
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Task</Text>
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={updateTask.isPending}
        >
          {updateTask.isPending ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
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
          editable={!updateTask.isPending}
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
          editable={!updateTask.isPending}
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
          editable={!updateTask.isPending}
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
          editable={!updateTask.isPending}
          containerStyle={styles.section}
        />

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Points are recalculated automatically based on estimated time
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  saveButton: {
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
