import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Task {
  id: string;
  household_id: string;
  title: string;
  description?: string;
  room?: string;
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
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  room?: string;
  assignee_id?: string;
  due_date?: string;
  estimated_minutes?: number;
  household_id: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  room?: string;
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      if (!user) throw new Error('User not authenticated');

      // Calculate points: 5 minutes = 1 point
      const points = input.estimated_minutes
        ? Math.ceil(input.estimated_minutes / 5)
        : 10;

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...input,
          points,
          created_by: user.id,
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

      // Award points to assignee (if assigned)
      if (task.assignee_id) {
        const { error: pointsError } = await supabase
          .from('members')
          .update({
            points: (task.assignee.points || 0) + task.points,
          })
          .eq('id', task.assignee_id);

        if (pointsError) throw pointsError;
      }

      return { task, pointsAwarded: task.points };
    },
    onSuccess: () => {
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
