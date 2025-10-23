import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUpdateTask, Task } from '@/hooks/useTasks';

export default function EditTaskModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId: string }>();
  const updateTask = useUpdateTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [room, setRoom] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});

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
    const newErrors: { title?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
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

      Alert.alert('Success', 'Task updated successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update task');
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
        <View style={styles.section}>
          <Text style={styles.label}>
            Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="e.g., Clean the kitchen"
            placeholderTextColor={Colors.gray500}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors({ ...errors, title: undefined });
            }}
            editable={!updateTask.isPending}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add details..."
            placeholderTextColor={Colors.gray500}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!updateTask.isPending}
          />
        </View>

        {/* Room */}
        <View style={styles.section}>
          <Text style={styles.label}>Room</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Kitchen, Living Room"
            placeholderTextColor={Colors.gray500}
            value={room}
            onChangeText={setRoom}
            editable={!updateTask.isPending}
          />
        </View>

        {/* Estimated Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Estimated Time (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 30"
            placeholderTextColor={Colors.gray500}
            value={estimatedMinutes}
            onChangeText={setEstimatedMinutes}
            keyboardType="number-pad"
            editable={!updateTask.isPending}
          />
          {estimatedMinutes && (
            <Text style={styles.helperText}>
              ≈ {calculatePoints(estimatedMinutes)} points
            </Text>
          )}
        </View>

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
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.labelLarge,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
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
