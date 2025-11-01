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
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUpdateTask, Task } from '@/hooks/useTasks';
import { useRooms } from '@/hooks/useRooms';
import { useHousehold } from '@/contexts/HouseholdContext';
import { TextInput } from '@/components/Form/TextInput';
import { TextArea } from '@/components/Form/TextArea';
import { RoomMultiSelectPicker } from '@/components/Form/RoomMultiSelectPicker';
import { useToast } from '@/components/Toast';
import {
  validateTaskTitle,
  validateTaskDescription,
  validateEstimatedMinutes,
} from '@/utils/validation';

export default function EditTaskModal() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ taskId: string }>();
  const updateTask = useUpdateTask();
  const { showToast } = useToast();
  const { household } = useHousehold();
  const { data: rooms = [] } = useRooms(household?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [points, setPoints] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    room?: string;
    estimatedMinutes?: string;
    points?: string;
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
    if (task && rooms.length > 0) {
      setTitle(task.title);
      setDescription(task.description || '');

      // Find room ID from room name
      if (task.room) {
        const matchingRoom = rooms.find(r => r.name === task.room);
        if (matchingRoom) {
          setSelectedRoomIds([matchingRoom.id]);
        }
      }

      setEstimatedMinutes(task.estimated_minutes?.toString() || '');
      setPoints(task.points?.toString() || '');
    }
  }, [task, rooms]);

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

    // Room validation not needed - using room picker with existing rooms

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
      // Get room name from selected room ID
      const selectedRoom = selectedRoomIds.length > 0
        ? rooms.find(r => r.id === selectedRoomIds[0])
        : undefined;

      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          title: title.trim(),
          description: description.trim() || undefined,
          room: selectedRoom?.name || undefined, // Store room name, not ID
          estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
          points: points ? parseInt(points) : undefined,
        },
      });

      showToast('Task updated successfully!', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to update task', 'error');
    }
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
            <ActivityIndicator size="small" color={colors.primary} />
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
        <RoomMultiSelectPicker
          label="Room (Optional)"
          value={selectedRoomIds}
          onChange={setSelectedRoomIds}
          householdId={household?.id || ''}
          placeholder="Select room"
          multiple={false}
          disabled={updateTask.isPending}
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
          leftIcon="time-outline"
          keyboardType="number-pad"
          editable={!updateTask.isPending}
          containerStyle={styles.section}
        />

        {/* Points */}
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
          editable={!updateTask.isPending}
          containerStyle={styles.section}
        />

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Enter points manually to reward task completion
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderBottomColor: colors.gray200,
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
  saveButton: {
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
});
