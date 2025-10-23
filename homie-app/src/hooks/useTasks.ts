import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { calculateLevel } from '@/utils/gamification';
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
  category?: string;
  assignee_id?: string;
  due_date?: string;
  estimated_minutes?: number;
  household_id: string;
  created_by_member_id: string; // Member ID who creates the task
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  room?: string;
  category?: string;
  assignee_id?: string;
  due_date?: string;
  estimated_minutes?: number;
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
      // Calculate points: 5 minutes = 1 point
      const points = input.estimated_minutes
        ? Math.ceil(input.estimated_minutes / 5)
        : 10;

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          household_id: input.household_id,
          title: input.title,
          description: input.description,
          category: input.category,
          room: input.room, // Store room as text field, not FK
          assignee_id: input.assignee_id,
          due_date: input.due_date,
          estimated_minutes: input.estimated_minutes,
          points,
          created_by: input.created_by_member_id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate tasks queries to refetch
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
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
      // Recalculate points if estimated_minutes changed
      const updatesToApply: any = { ...updates };

      if (updates.estimated_minutes !== undefined) {
        updatesToApply.points = Math.ceil(updates.estimated_minutes / 5);
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updatesToApply)
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
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('*, assignee:members!tasks_assignee_id_fkey(*)')
        .eq('id', taskId)
        .single();

      if (fetchError) throw fetchError;

      // Update task as completed
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          actual_minutes: actualMinutes,
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Award points to assignee (if assigned) and update streak
      if (task.assignee_id) {
        const assignee = task.assignee;
        const newPoints = (assignee.points || 0) + task.points;
        const newLevel = calculateLevel(newPoints);

        // Calculate streak
        const now = new Date();
        const lastCompleted = assignee.last_completed_at
          ? new Date(assignee.last_completed_at)
          : null;

        let newStreak = 1;
        if (lastCompleted) {
          const hoursSinceLastTask = (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60);
          // If within 48 hours, increment streak; otherwise reset to 1
          if (hoursSinceLastTask <= 48) {
            newStreak = (assignee.streak_days || 0) + 1;
          }
        }

        const { error: pointsError } = await supabase
          .from('members')
          .update({
            points: newPoints,
            level: newLevel,
            streak_days: newStreak,
            last_completed_at: now.toISOString(),
          })
          .eq('id', task.assignee_id);

        if (pointsError) throw pointsError;
      }

      return { task, pointsAwarded: task.points };
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
