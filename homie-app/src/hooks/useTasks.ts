import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { trackTaskEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

export interface Task {
  id: string;
  household_id: string;
  title: string;
  description?: string;
  room?: string;
  category?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee_id?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  created_by: string;
  due_date?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  points: number;
  created_at: string;
  completed_at?: string;
  recurring_task_id?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  room?: string;
  category?: string; // Legacy - for old code compatibility
  category_id?: string; // New - FK to task_categories table
  assignee_id?: string;
  due_date?: string;
  estimated_minutes?: number;
  points?: number; // Manual points entry
  household_id: string;
  created_by_member_id: string; // Member ID who creates the task
  has_subtasks?: boolean;
  subtasks?: Array<{
    title: string;
    points: number;
    sort_order: number;
  }>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  room?: string;
  category?: string;
  assignee_id?: string;
  due_date?: string;
  estimated_minutes?: number;
  points?: number; // Manual points entry
  status?: 'pending' | 'in_progress' | 'completed';
  actual_minutes?: number;
}

const QUERY_KEY = 'tasks';

/**
 * Fetch all tasks for a household
 */
export function useTasks(householdId?: string) {
  const { user } = useAuth();

  return useQuery<Task[]>({
    queryKey: [QUERY_KEY, householdId],
    queryFn: async () => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:members!tasks_assignee_id_fkey(
            id,
            name,
            avatar
          )
        `)
        .eq('household_id', householdId)
        .neq('status', 'completed')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      // Transform data to include assignee details
      return (data || []).map((task: any) => ({
        ...task,
        assignee_name: task.assignee?.name,
        assignee_avatar: task.assignee?.avatar,
      }));
    },
    enabled: !!householdId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch my tasks (assigned to me or unassigned)
 */
export function useMyTasks(householdId?: string, memberId?: string) {
  const { user } = useAuth();

  return useQuery<Task[]>({
    queryKey: [QUERY_KEY, 'my-tasks', householdId, memberId],
    queryFn: async () => {
      if (!householdId) return [];

      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:members!tasks_assignee_id_fkey(
            id,
            name,
            avatar
          )
        `)
        .eq('household_id', householdId)
        .neq('status', 'completed')
        .order('due_date', { ascending: true, nullsFirst: false });

      // Filter for my tasks or unassigned
      if (memberId) {
        query = query.or(`assignee_id.eq.${memberId},assignee_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((task: any) => ({
        ...task,
        assignee_name: task.assignee?.name,
        assignee_avatar: task.assignee?.avatar,
      }));
    },
    enabled: !!householdId && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      // Use manual points, or calculate from subtasks, or default to 10
      let points = input.points || 10;

      if (input.has_subtasks && input.subtasks && input.subtasks.length > 0) {
        // If has subtasks, sum their points
        points = input.subtasks.reduce((sum, subtask) => sum + subtask.points, 0);
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          household_id: input.household_id,
          title: input.title,
          description: input.description,
          category: input.category, // Legacy field
          category_id: input.category_id, // New FK field
          room: input.room, // Store room as text field, not FK
          assignee_id: input.assignee_id,
          due_date: input.due_date,
          estimated_minutes: input.has_subtasks ? undefined : input.estimated_minutes,
          points,
          created_by: input.created_by_member_id,
          status: 'pending',
          has_subtasks: input.has_subtasks || false,
        })
        .select()
        .single();

      if (error) throw error;

      // If has subtasks, create them
      if (input.has_subtasks && input.subtasks && input.subtasks.length > 0) {
        const subtasksToCreate = input.subtasks.map(subtask => ({
          task_id: task.id,
          title: subtask.title,
          points: subtask.points,
          sort_order: subtask.sort_order,
          is_completed: false,
        }));

        const { error: subtasksError } = await supabase
          .from('subtasks')
          .insert(subtasksToCreate);

        if (subtasksError) {
          // If subtasks creation fails, delete the task
          await supabase.from('tasks').delete().eq('id', task.id);
          throw subtasksError;
        }
      }

      return task;
    },
    onSuccess: (data) => {
      // Invalidate tasks queries to refetch
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      // Also invalidate subtasks if they were created
      if (data.has_subtasks) {
        queryClient.invalidateQueries({ queryKey: ['subtasks', data.id] });
      }
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTaskInput }) => {
      // Use updates as-is, no automatic points calculation
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Complete a task and award points
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      actualMinutes
    }: {
      taskId: string;
      actualMinutes?: number;
    }) => {
      // Use atomic RPC function to prevent race conditions
      // This handles task completion + points award + streak calculation in a single transaction
      const { data, error } = await supabase.rpc('complete_task_atomic', {
        task_uuid: taskId,
        actual_mins: actualMinutes || null,
      });

      if (error) throw error;

      return {
        task: data.task,
        pointsAwarded: data.points_awarded,
      };
    },
    onSuccess: (data) => {
      // Track task completed
      trackTaskEvent(ANALYTICS_EVENTS.TASK_COMPLETED, {
        task_id: data.task.id,
        points: data.pointsAwarded,
        status: 'completed',
        has_assignee: !!data.task.assignee_id,
      });

      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
