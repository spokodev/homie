import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useCreateRecurringTask } from '@/hooks/useRecurringTasks';
import { useMembers } from '@/hooks/useMembers';
import { useRooms } from '@/hooks/useRooms';
import { TASK_CATEGORIES } from '@/constants';
import {
  RecurrenceFrequency,
  DayOfWeek,
  RecurrenceRule,
  getRecurrenceDescription,
} from '@/types/recurrence';
import { useToast } from '@/components/Toast';

const DAYS_OF_WEEK: { id: DayOfWeek; label: string }[] = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

export default function CreateRecurringTaskScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { data: members = [] } = useMembers();
  const { data: rooms = [] } = useRooms();
  const createRecurringTask = useCreateRecurringTask();
  const { showToast } = useToast();

  // Task fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  // Recurrence fields
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
  const [interval, setInterval] = useState('1');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endAfterOccurrences, setEndAfterOccurrences] = useState('');

  const [loading, setLoading] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }

    if (frequency === 'weekly' && selectedDays.length === 0) {
      showToast('Please select at least one day for weekly recurrence', 'error');
      return;
    }

    const intervalNum = parseInt(interval) || 1;
    if (intervalNum < 1) {
      showToast('Interval must be at least 1', 'error');
      return;
    }

    const recurrenceRule: RecurrenceRule = {
      frequency,
      interval: intervalNum,
    };

    if (frequency === 'weekly' && selectedDays.length > 0) {
      recurrenceRule.daysOfWeek = selectedDays;
    }

    if (frequency === 'monthly') {
      const day = parseInt(dayOfMonth) || 1;
      recurrenceRule.dayOfMonth = Math.max(1, Math.min(31, day));
    }

    if (hasEndDate && endAfterOccurrences) {
      const occurrences = parseInt(endAfterOccurrences);
      if (occurrences > 0) {
        recurrenceRule.endAfterOccurrences = occurrences;
      }
    }

    setLoading(true);
    try {
      await createRecurringTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category: selectedCategory || undefined,
        room: selectedRoom || undefined,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
        assignee_id: selectedAssignee || undefined,
        recurrence_rule: recurrenceRule,
      });

      showToast('Recurring task created!', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to create recurring task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const humanMembers = members.filter((m) => m.type === 'human');
  const previewRule: RecurrenceRule = {
    frequency,
    interval: parseInt(interval) || 1,
    daysOfWeek: frequency === 'weekly' ? selectedDays : undefined,
    dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) || 1 : undefined,
    endAfterOccurrences: hasEndDate && endAfterOccurrences ? parseInt(endAfterOccurrences) : undefined,
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Recurring Task</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading}>
          <Text style={[styles.createButton, loading && styles.createButtonDisabled]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Task Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Task title *"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.textSecondary}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Estimated Time (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                value={estimatedMinutes}
                onChangeText={setEstimatedMinutes}
                keyboardType="number-pad"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Recurrence Pattern */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repeat Pattern</Text>

          {/* Frequency */}
          <View style={styles.frequencyContainer}>
            {(['daily', 'weekly', 'monthly'] as RecurrenceFrequency[]).map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[styles.frequencyButton, frequency === freq && styles.frequencyButtonActive]}
                onPress={() => setFrequency(freq)}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    frequency === freq && styles.frequencyButtonTextActive,
                  ]}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Interval */}
          <View style={styles.intervalContainer}>
            <Text style={styles.label}>Every</Text>
            <TextInput
              style={[styles.input, styles.intervalInput]}
              value={interval}
              onChangeText={setInterval}
              keyboardType="number-pad"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.label}>{frequency === 'daily' ? 'day(s)' : frequency === 'weekly' ? 'week(s)' : 'month(s)'}</Text>
          </View>

          {/* Weekly: Days of week */}
          {frequency === 'weekly' && (
            <View style={styles.daysContainer}>
              <Text style={styles.label}>On days:</Text>
              <View style={styles.daysRow}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayButton,
                      selectedDays.includes(day.id) && styles.dayButtonActive,
                    ]}
                    onPress={() => toggleDay(day.id)}
                  >
                    <Text
                      style={[
                        styles.dayButtonText,
                        selectedDays.includes(day.id) && styles.dayButtonTextActive,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Monthly: Day of month */}
          {frequency === 'monthly' && (
            <View style={styles.dayOfMonthContainer}>
              <Text style={styles.label}>On day:</Text>
              <TextInput
                style={[styles.input, styles.dayOfMonthInput]}
                value={dayOfMonth}
                onChangeText={setDayOfMonth}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.helperText}>(1-31)</Text>
            </View>
          )}

          {/* End condition */}
          <View style={styles.endConditionContainer}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>End after number of times</Text>
              <Switch
                value={hasEndDate}
                onValueChange={setHasEndDate}
                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                thumbColor={hasEndDate ? colors.primary : colors.gray500}
              />
            </View>
            {hasEndDate && (
              <TextInput
                style={[styles.input, styles.occurrencesInput]}
                placeholder="Number of occurrences"
                value={endAfterOccurrences}
                onChangeText={setEndAfterOccurrences}
                keyboardType="number-pad"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          </View>

          {/* Preview */}
          <View style={styles.previewContainer}>
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            <Text style={styles.previewText}>{getRecurrenceDescription(previewRule)}</Text>
          </View>
        </View>

        {/* Assignment & Categorization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignment & Category</Text>

          {/* Assignee */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Assign to:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.assigneeChip, !selectedAssignee && styles.assigneeChipActive]}
                onPress={() => setSelectedAssignee(null)}
              >
                <Text style={styles.assigneeChipText}>Anyone</Text>
              </TouchableOpacity>
              {humanMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.assigneeChip,
                    selectedAssignee === member.id && styles.assigneeChipActive,
                  ]}
                  onPress={() => setSelectedAssignee(member.id)}
                >
                  <Text style={styles.assigneeAvatar}>{member.avatar}</Text>
                  <Text style={styles.assigneeChipText}>{member.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TASK_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.id && styles.categoryChipActive,
                    selectedCategory === cat.id && { borderColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryChipText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Room */}
          {rooms.length > 0 && (
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Room:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {rooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[
                      styles.roomChip,
                      selectedRoom === room.id && styles.roomChipActive,
                    ]}
                    onPress={() => setSelectedRoom(room.id === selectedRoom ? null : room.id)}
                  >
                    <Text style={styles.roomIcon}>{room.icon}</Text>
                    <Text style={styles.roomChipText}>{room.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  createButton: {
    ...Typography.button,
    color: colors.primary,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
    backgroundColor: colors.card,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h5,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  input: {
    ...Typography.bodyLarge,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: colors.card,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    ...Typography.labelLarge,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  frequencyButtonText: {
    ...Typography.button,
    color: colors.text,
  },
  frequencyButtonTextActive: {
    color: colors.card,
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  intervalInput: {
    width: 60,
    textAlign: 'center',
    marginBottom: 0,
  },
  daysContainer: {
    marginBottom: Spacing.md,
  },
  daysRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  dayButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: colors.card,
  },
  dayOfMonthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dayOfMonthInput: {
    width: 60,
    textAlign: 'center',
    marginBottom: 0,
  },
  helperText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  endConditionContainer: {
    marginBottom: Spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  occurrencesInput: {
    marginTop: Spacing.sm,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  previewText: {
    ...Typography.bodyMedium,
    color: colors.primary,
    flex: 1,
  },
  pickerContainer: {
    marginBottom: Spacing.md,
  },
  assigneeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: Spacing.sm,
  },
  assigneeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  assigneeAvatar: {
    fontSize: 16,
    marginRight: 4,
  },
  assigneeChipText: {
    ...Typography.bodyMedium,
    color: colors.text,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    borderWidth: 2,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryChipText: {
    ...Typography.bodyMedium,
    color: colors.text,
  },
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: Spacing.sm,
  },
  roomChipActive: {
    backgroundColor: colors.secondary + '20',
    borderColor: colors.secondary,
  },
  roomIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  roomChipText: {
    ...Typography.bodyMedium,
    color: colors.text,
  },
});
