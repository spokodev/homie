import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Household {
  id: string;
  name: string;
  icon: string;
  settings?: any;
  created_at: string;
}

export interface CreateHouseholdInput {
  name: string;
  icon?: string;
  settings?: any;
}

export interface UpdateHouseholdInput {
  name?: string;
  icon?: string;
  settings?: any;
}

const QUERY_KEY = 'households';

/**
 * Fetch user's households
 */
export function useHouseholds() {
  const { user } = useAuth();

  return useQuery<Household[]>({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get member records for this user
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('household_id')
        .eq('user_id', user.id);

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      const householdIds = members.map((m) => m.household_id);

      // Get households
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .in('id', householdIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get current household (first one for now, can be extended for switching)
 */
export function useCurrentHousehold() {
  const { user } = useAuth();
  const { data: households, ...rest } = useHouseholds();

  return {
    data: households?.[0] || null,
    ...rest,
  };
}

/**
 * Create a new household
 */
export function useCreateHousehold() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateHouseholdInput) => {
      const { data, error } = await supabase
        .from('households')
        .insert({
          name: input.name,
          icon: input.icon || '🏠',
          settings: input.settings || {},
        })
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
 * Update household
 */
export function useUpdateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateHouseholdInput;
    }) => {
      const { data, error } = await supabase
        .from('households')
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
 * Delete household
 */
export function useDeleteHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (householdId: string) => {
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', householdId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
