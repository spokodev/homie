import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  points: number;
  is_completed: boolean;
  sort_order: number;
  created_at?: string;
}

export interface CreateSubtaskInput {
  taskId: string;
  title: string;
  points?: number;
  sortOrder?: number;
}

export interface UpdateSubtaskInput {
  id: string;
  title?: string;
  points?: number;
  is_completed?: boolean;
}

export interface ReorderSubtasksInput {
  taskId: string;
  subtaskIds: string[];
}

/**
 * Calculate total points from subtasks
 * @param subtasks - Array of subtasks
 * @param completedIds - IDs of completed subtasks
 * @returns Total points
 */
export function calculateTaskPoints(
  subtasks: Pick<Subtask, 'id' | 'points' | 'is_completed'>[],
  completedIds: string[]
): number {
  if (!subtasks || subtasks.length === 0) {
    return 0;
  }

  if (completedIds.length === 0) {
    // If no specific IDs provided, sum all subtasks
    return subtasks.reduce((sum, subtask) => sum + subtask.points, 0);
  }

  // Sum points of completed subtasks
  return subtasks
    .filter(subtask => completedIds.includes(subtask.id))
    .reduce((sum, subtask) => sum + subtask.points, 0);
}

/**
 * Validate points value
 */
function validatePoints(points?: number): void {
  if (points !== undefined) {
    if (points < 1 || points > 100) {
      throw new Error('Points must be between 1 and 100');
    }
  }
}

/**
 * Fetch all subtasks for a task
 */
export function useSubtasks(taskId?: string) {
  return useQuery<Subtask[]>({
    queryKey: ['subtasks', taskId],
    queryFn: async () => {
      if (!taskId) throw new Error('No task ID');

      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Subtask[];
    },
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}

/**
 * Create a new subtask
 */
export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSubtaskInput) => {
      // Validate points
      validatePoints(input.points);

      // Get max sort_order if not provided
      let sortOrder = input.sortOrder;
      if (sortOrder === undefined) {
        const { data: maxData } = await supabase
          .from('subtasks')
          .select('sort_order')
          .eq('task_id', input.taskId)
          .order('sort_order', { ascending: false })
          .limit(1)
          .single();

        sortOrder = maxData ? maxData.sort_order + 1 : 0;
      }

      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          task_id: input.taskId,
          title: input.title,
          points: input.points || 1,
          is_completed: false,
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      // Update task to indicate it has subtasks
      await supabase
        .from('tasks')
        .update({ has_subtasks: true })
        .eq('id', input.taskId);

      return data as Subtask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task', data.task_id] });
    },
  });
}

/**
 * Update a subtask
 */
export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSubtaskInput) => {
      // Validate points if provided
      validatePoints(input.points);

      const { title, points, is_completed } = input;
      const updates: any = {};

      if (title !== undefined) updates.title = title;
      if (points !== undefined) updates.points = points;
      if (is_completed !== undefined) updates.is_completed = is_completed;

      const { data, error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as Subtask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task', data.task_id] });
    },
  });
}

/**
 * Delete a subtask
 */
export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subtaskId: string) => {
      // Get subtask to know the task_id
      const { data: subtask } = await supabase
        .from('subtasks')
        .select('task_id')
        .eq('id', subtaskId)
        .single();

      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      // Check if task still has subtasks
      if (subtask) {
        const { count } = await supabase
          .from('subtasks')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', subtask.task_id);

        // Update task if no more subtasks
        if (count === 0) {
          await supabase
            .from('tasks')
            .update({ has_subtasks: false })
            .eq('id', subtask.task_id);
        }
      }

      return { subtaskId, taskId: subtask?.task_id };
    },
    onSuccess: (data) => {
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: ['subtasks', data.taskId] });
        queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
      }
    },
  });
}

/**
 * Reorder subtasks
 */
export function useReorderSubtasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReorderSubtasksInput) => {
      // Create RPC function if it doesn't exist
      // This would normally be in a migration, but adding here for completeness
      const { error: rpcError } = await supabase.rpc('reorder_subtasks', {
        p_task_id: input.taskId,
        p_subtask_ids: input.subtaskIds,
      });

      if (rpcError) {
        // Fallback to manual updates if RPC doesn't exist
        const updates = input.subtaskIds.map((id, index) => ({
          id,
          sort_order: index,
        }));

        for (const update of updates) {
          await supabase
            .from('subtasks')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
        }
      }

      return input;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', data.taskId] });
    },
  });
}

/**
 * Toggle subtask completion
 */
export function useToggleSubtaskCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subtaskId,
      isCompleted,
    }: {
      subtaskId: string;
      isCompleted: boolean;
    }) => {
      const { data, error } = await supabase
        .from('subtasks')
        .update({ is_completed: isCompleted })
        .eq('id', subtaskId)
        .select()
        .single();

      if (error) throw error;
      return data as Subtask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', data.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task', data.task_id] });
    },
  });
}

/**
 * Update task's completed subtasks
 * Called when completing a task to record which subtasks were done
 */
export function useUpdateCompletedSubtasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      completedSubtaskIds,
    }: {
      taskId: string;
      completedSubtaskIds: string[];
    }) => {
      // Mark subtasks as completed
      for (const subtaskId of completedSubtaskIds) {
        await supabase
          .from('subtasks')
          .update({ is_completed: true })
          .eq('id', subtaskId);
      }

      // Update task with completed subtask IDs
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed_subtask_ids: completedSubtaskIds })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', data.id] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Get subtasks statistics for a task
 */
export function useSubtaskStats(taskId?: string) {
  const { data: subtasks } = useSubtasks(taskId);

  if (!subtasks || subtasks.length === 0) {
    return {
      total: 0,
      completed: 0,
      totalPoints: 0,
      earnedPoints: 0,
      completionRate: 0,
    };
  }

  const completed = subtasks.filter(s => s.is_completed);
  const totalPoints = subtasks.reduce((sum, s) => sum + s.points, 0);
  const earnedPoints = completed.reduce((sum, s) => sum + s.points, 0);

  return {
    total: subtasks.length,
    completed: completed.length,
    totalPoints,
    earnedPoints,
    completionRate: Math.round((completed.length / subtasks.length) * 100),
  };
}