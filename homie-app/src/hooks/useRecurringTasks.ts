import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHousehold } from '@/contexts/HouseholdContext';
import { RecurringTask, RecurrenceRule, calculateNextOccurrence } from '@/types/recurrence';
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

export interface CreateRecurringTaskInput {
  title: string;
  description?: string;
  category?: string;
  room?: string;
  estimated_minutes?: number;
  assignee_id?: string;
  recurrence_rule: RecurrenceRule;
}

export interface UpdateRecurringTaskInput {
  title?: string;
  description?: string;
  category?: string;
  room?: string;
  estimated_minutes?: number;
  assignee_id?: string;
  recurrence_rule?: RecurrenceRule;
  is_active?: boolean;
}

/**
 * Fetch all recurring tasks for the current household
 */
export function useRecurringTasks() {
  const { household } = useHousehold();

  return useQuery({
    queryKey: ['recurring-tasks', household?.id],
    queryFn: async () => {
      if (!household?.id) throw new Error('No household ID');

      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('household_id', household.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RecurringTask[];
    },
    enabled: !!household?.id,
  });
}

/**
 * Fetch a single recurring task by ID
 */
export function useRecurringTask(id: string) {
  return useQuery({
    queryKey: ['recurring-task', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as RecurringTask;
    },
    enabled: !!id,
  });
}

/**
 * Create a new recurring task
 */
export function useCreateRecurringTask() {
  const queryClient = useQueryClient();
  const { household, member } = useHousehold();

  return useMutation({
    mutationFn: async (input: CreateRecurringTaskInput) => {
      if (!household?.id || !member?.id) {
        throw new Error('Missing household or member');
      }

      // Calculate initial next occurrence
      const now = new Date();
      const nextOccurrence = calculateNextOccurrence(now, input.recurrence_rule);

      if (!nextOccurrence) {
        throw new Error('Invalid recurrence rule - no future occurrences');
      }

      // Calculate points based on estimated time
      const points = input.estimated_minutes ? Math.ceil(input.estimated_minutes / 5) : 1;

      const { data, error } = await supabase
        .from('recurring_tasks')
        .insert({
          household_id: household.id,
          title: input.title,
          description: input.description,
          category: input.category,
          room: input.room,
          estimated_minutes: input.estimated_minutes,
          points,
          assignee_id: input.assignee_id,
          recurrence_rule: input.recurrence_rule,
          is_active: true,
          next_occurrence_at: nextOccurrence.toISOString(),
          total_occurrences: 0,
          created_by: member.id,
        })
        .select()
        .single();

      if (error) throw error;

      trackEvent(ANALYTICS_EVENTS.TASK_CREATED, {
        recurring: true,
        frequency: input.recurrence_rule.frequency,
        has_assignee: !!input.assignee_id,
        category: input.category,
      });

      return data as RecurringTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
    },
  });
}

/**
 * Update a recurring task
 */
export function useUpdateRecurringTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateRecurringTaskInput;
    }) => {
      const updateData: any = { ...updates };

      // If recurrence rule changed, recalculate next occurrence
      if (updates.recurrence_rule) {
        const nextOccurrence = calculateNextOccurrence(new Date(), updates.recurrence_rule);
        if (nextOccurrence) {
          updateData.next_occurrence_at = nextOccurrence.toISOString();
        }
      }

      // Recalculate points if estimated_minutes changed
      if (updates.estimated_minutes !== undefined) {
        updateData.points = Math.ceil(updates.estimated_minutes / 5);
      }

      const { data, error } = await supabase
        .from('recurring_tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      trackEvent(ANALYTICS_EVENTS.TASK_UPDATED, {
        recurring: true,
        task_id: id,
      });

      return data as RecurringTask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-task', data.id] });
    },
  });
}

/**
 * Delete a recurring task
 */
export function useDeleteRecurringTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_tasks').delete().eq('id', id);

      if (error) throw error;

      trackEvent(ANALYTICS_EVENTS.TASK_DELETED, {
        recurring: true,
        task_id: id,
      });

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
    },
  });
}

/**
 * Toggle recurring task active status
 */
export function useToggleRecurringTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      trackEvent(ANALYTICS_EVENTS.TASK_UPDATED, {
        recurring: true,
        task_id: id,
        action: isActive ? 'activated' : 'paused',
      });

      return data as RecurringTask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-task', data.id] });
    },
  });
}

/**
 * Generate task instances for due recurring tasks
 * This should be called periodically (e.g., on app start or daily)
 */
export function useGenerateRecurringTaskInstances() {
  const queryClient = useQueryClient();
  const { household, member } = useHousehold();

  return useMutation({
    mutationFn: async () => {
      if (!household?.id || !member?.id) {
        throw new Error('Missing household or member');
      }

      const now = new Date();

      // Fetch active recurring tasks that are due
      const { data: recurringTasks, error: fetchError } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('household_id', household.id)
        .eq('is_active', true)
        .lte('next_occurrence_at', now.toISOString());

      if (fetchError) throw fetchError;

      if (!recurringTasks || recurringTasks.length === 0) {
        return { generated: 0, tasks: [] };
      }

      const generatedTasks: any[] = [];

      // Generate task instances
      for (const recurringTask of recurringTasks as RecurringTask[]) {
        try {
          // Create the task instance
          const { data: newTask, error: createError } = await supabase
            .from('tasks')
            .insert({
              household_id: household.id,
              title: recurringTask.title,
              description: recurringTask.description,
              category: recurringTask.category,
              room: recurringTask.room,
              estimated_minutes: recurringTask.estimated_minutes,
              points: recurringTask.points,
              assignee_id: recurringTask.assignee_id,
              status: 'pending',
              recurring_task_id: recurringTask.id,
              created_by: recurringTask.created_by,
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating recurring task instance:', createError);
            continue;
          }

          generatedTasks.push(newTask);

          // Calculate next occurrence
          const nextOccurrence = calculateNextOccurrence(
            new Date(recurringTask.next_occurrence_at),
            recurringTask.recurrence_rule
          );

          // Update recurring task
          await supabase
            .from('recurring_tasks')
            .update({
              last_generated_at: now.toISOString(),
              next_occurrence_at: nextOccurrence ? nextOccurrence.toISOString() : null,
              total_occurrences: recurringTask.total_occurrences + 1,
              is_active: nextOccurrence !== null, // Deactivate if no more occurrences
            })
            .eq('id', recurringTask.id);
        } catch (error) {
          console.error('Error processing recurring task:', error);
        }
      }

      return { generated: generatedTasks.length, tasks: generatedTasks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
