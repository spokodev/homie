import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TaskTemplate {
  id: string;
  household_id: string;
  name: string;
  icon: string;
  description?: string;
  estimated_minutes?: number;
  points: number;
  category_id?: string;
  room?: string;
  is_default: boolean;
  is_system: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface CreateTaskTemplateInput {
  household_id: string;
  name: string;
  icon?: string;
  description?: string;
  estimated_minutes?: number;
  points?: number;
  category_id?: string;
  room?: string;
  created_by: string;
}

interface UpdateTaskTemplateInput {
  id: string;
  name?: string;
  icon?: string;
  description?: string;
  estimated_minutes?: number;
  points?: number;
  category_id?: string;
  room?: string;
}

const QUERY_KEY = 'task_templates';

/**
 * Fetch task templates for a household
 */
export function useTaskTemplates(householdId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, householdId],
    queryFn: async () => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('household_id', householdId)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as TaskTemplate[];
    },
    enabled: !!householdId,
  });
}

/**
 * Create a new task template
 */
export function useCreateTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskTemplateInput) => {
      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          household_id: input.household_id,
          name: input.name,
          icon: input.icon || '📋',
          description: input.description,
          estimated_minutes: input.estimated_minutes,
          points: input.points || 10,
          category_id: input.category_id,
          room: input.room,
          created_by: input.created_by,
          is_default: false,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TaskTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.household_id] });
    },
  });
}

/**
 * Update an existing task template
 */
export function useUpdateTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskTemplateInput) => {
      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from('task_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TaskTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.household_id] });
    },
  });
}

/**
 * Delete a task template
 */
export function useDeleteTaskTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, householdId }: { templateId: string; householdId: string }) => {
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return { templateId, householdId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, result.householdId] });
    },
  });
}

/**
 * Create a task from a template using RPC function
 */
export function useCreateTaskFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      assigneeId,
      dueDate,
    }: {
      templateId: string;
      assigneeId?: string;
      dueDate?: string;
    }) => {
      const { data, error } = await supabase.rpc('create_task_from_template', {
        template_uuid: templateId,
        assignee_uuid: assigneeId || null,
        due_datetime: dueDate || null,
      });

      if (error) throw error;
      return data; // Returns new task ID
    },
    onSuccess: () => {
      // Invalidate tasks query to show new task
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Get frequently used tasks as potential templates
 * Returns tasks that have been created multiple times with similar names
 */
export function useFrequentTasks(householdId?: string, limit: number = 10) {
  return useQuery({
    queryKey: ['frequent_tasks', householdId, limit],
    queryFn: async () => {
      if (!householdId) return [];

      // Query to find frequently created tasks
      const { data, error } = await supabase
        .from('tasks')
        .select('title, estimated_minutes, points, room, category_id')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(100); // Get recent tasks

      if (error) throw error;

      // Group by title and count occurrences
      const taskCounts = new Map<string, { count: number; task: any }>();
      data.forEach(task => {
        const title = task.title.toLowerCase().trim();
        if (taskCounts.has(title)) {
          const entry = taskCounts.get(title)!;
          entry.count++;
        } else {
          taskCounts.set(title, { count: 1, task });
        }
      });

      // Filter tasks that appear more than once and sort by frequency
      const frequentTasks = Array.from(taskCounts.entries())
        .filter(([_, entry]) => entry.count > 1)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, limit)
        .map(([_, entry]) => ({
          ...entry.task,
          frequency: entry.count,
        }));

      return frequentTasks;
    },
    enabled: !!householdId,
  });
}
