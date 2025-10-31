import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHousehold } from '@/contexts/HouseholdContext';

export interface TaskCategory {
  id: string;
  household_id: string;
  name: string;
  icon: string;
  color: string;
  created_by?: string;
  is_custom: boolean;
  created_at?: string;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  color: string;
}

// Validation helpers
const validateCategoryInput = (input: CreateCategoryInput): void => {
  // Validate name length
  if (input.name.length > 50) {
    throw new Error('Category name must be 50 characters or less');
  }

  // Validate icon is emoji (simplified check)
  const emojiRegex = /^[\p{Emoji}]$/u;
  if (!emojiRegex.test(input.icon) || input.icon.length > 2) {
    throw new Error('Icon must be a single emoji');
  }

  // Validate color is hex format
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!hexColorRegex.test(input.color)) {
    throw new Error('Color must be in hex format (#RRGGBB)');
  }
};

/**
 * Fetch all task categories for the household
 * Includes both predefined and custom categories
 */
export function useTaskCategories() {
  const { household } = useHousehold();

  return useQuery<TaskCategory[]>({
    queryKey: ['task-categories', household?.id],
    queryFn: async () => {
      if (!household?.id) throw new Error('No household ID');

      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('household_id', household.id)
        .order('is_custom', { ascending: true }) // Predefined first
        .order('name', { ascending: true });

      if (error) throw error;
      return data as TaskCategory[];
    },
    enabled: !!household?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Create a new custom category
 * Only admins can create categories
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { household, member } = useHousehold();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      // Check if user is admin
      if (member?.role !== 'admin') {
        throw new Error('Only admins can create categories');
      }

      if (!household?.id || !member?.id) {
        throw new Error('Missing household or member');
      }

      // Validate input
      validateCategoryInput(input);

      const { data, error } = await supabase
        .from('task_categories')
        .insert({
          household_id: household.id,
          name: input.name,
          icon: input.icon,
          color: input.color,
          created_by: member.id,
          is_custom: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A category with this name already exists');
        }
        throw error;
      }

      return data as TaskCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
    },
  });
}

/**
 * Update a custom category
 * Only admins can update categories
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { member } = useHousehold();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateCategoryInput>;
    }) => {
      // Check if user is admin
      if (member?.role !== 'admin') {
        throw new Error('Only admins can update categories');
      }

      // Validate input if provided
      if (updates.name && updates.name.length > 50) {
        throw new Error('Category name must be 50 characters or less');
      }
      if (updates.icon) {
        const emojiRegex = /^[\p{Emoji}]$/u;
        if (!emojiRegex.test(updates.icon) || updates.icon.length > 2) {
          throw new Error('Icon must be a single emoji');
        }
      }
      if (updates.color) {
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (!hexColorRegex.test(updates.color)) {
          throw new Error('Color must be in hex format (#RRGGBB)');
        }
      }

      const { data, error } = await supabase
        .from('task_categories')
        .update(updates)
        .eq('id', id)
        .eq('is_custom', true) // Can only update custom categories
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A category with this name already exists');
        }
        throw error;
      }

      return data as TaskCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
    },
  });
}

/**
 * Delete a custom category
 * Only admins can delete categories
 * Cannot delete predefined categories
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { member } = useHousehold();

  return useMutation({
    mutationFn: async (category: Pick<TaskCategory, 'id' | 'name' | 'is_custom'>) => {
      // Check if user is admin
      if (member?.role !== 'admin') {
        throw new Error('Only admins can delete categories');
      }

      // Check if category is custom
      if (!category.is_custom) {
        throw new Error('Cannot delete predefined categories');
      }

      const { error } = await supabase
        .from('task_categories')
        .delete()
        .eq('id', category.id)
        .eq('is_custom', true); // Extra safety check

      if (error) throw error;

      return category.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories'] });
    },
  });
}

/**
 * Get a single category by ID
 */
export function useCategoryById(categoryId?: string) {
  const { household } = useHousehold();

  return useQuery<TaskCategory>({
    queryKey: ['task-category', categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error('No category ID');

      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      return data as TaskCategory;
    },
    enabled: !!categoryId && !!household?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get categories for task creation
 * Returns both predefined and custom categories
 */
export function useCategoriesForTask() {
  const categories = useTaskCategories();

  return {
    ...categories,
    predefined: categories.data?.filter(c => !c.is_custom) || [],
    custom: categories.data?.filter(c => c.is_custom) || [],
  };
}