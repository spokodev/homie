import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Member {
  id: string;
  household_id: string;
  user_id?: string;
  name: string;
  avatar: string;
  type: 'human' | 'pet';
  role: 'admin' | 'member';
  points: number;
  level: number;
  streak_days: number;
  created_at: string;
}

export interface CreateMemberInput {
  household_id: string;
  user_id?: string;
  name: string;
  avatar?: string;
  type?: 'human' | 'pet';
  role?: 'admin' | 'member';
}

export interface UpdateMemberInput {
  name?: string;
  avatar?: string;
  type?: 'human' | 'pet';
  role?: 'admin' | 'member';
  points?: number;
  level?: number;
  streak_days?: number;
}

const QUERY_KEY = 'members';

/**
 * Fetch all members for a household
 */
export function useMembers(householdId?: string) {
  return useQuery<Member[]>({
    queryKey: [QUERY_KEY, householdId],
    queryFn: async () => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('household_id', householdId)
        .order('points', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!householdId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get current user's member record for a household
 */
export function useCurrentMember(householdId?: string) {
  const { user } = useAuth();

  return useQuery<Member | null>({
    queryKey: [QUERY_KEY, 'current', householdId, user?.id],
    queryFn: async () => {
      if (!householdId || !user) return null;

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('household_id', householdId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows
        throw error;
      }

      return data;
    },
    enabled: !!householdId && !!user,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new member
 */
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMemberInput) => {
      const { data, error } = await supabase
        .from('members')
        .insert({
          household_id: input.household_id,
          user_id: input.user_id,
          name: input.name,
          avatar: input.avatar || '😊',
          type: input.type || 'human',
          role: input.role || 'member',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.household_id] });
    },
  });
}

/**
 * Update member
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateMemberInput;
    }) => {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.household_id] });
    },
  });
}

/**
 * Delete member
 */
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, householdId }: { id: string; householdId: string }) => {
      const { error } = await supabase.from('members').delete().eq('id', id);

      if (error) throw error;
      return { householdId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.householdId] });
    },
  });
}

/**
 * Add points to a member
 */
export function useAddPoints() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      points,
      householdId,
    }: {
      memberId: string;
      points: number;
      householdId: string;
    }) => {
      // Use atomic RPC function to prevent race conditions
      const { data, error } = await supabase.rpc('award_points_atomic', {
        member_uuid: memberId,
        points_to_add: points,
      });

      if (error) throw error;

      // Return the updated member data
      if (data && data[0]) {
        return {
          id: memberId,
          household_id: householdId,
          points: data[0].new_points,
          level: data[0].new_level,
        };
      }

      throw new Error('Failed to update points');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.household_id] });
    },
  });
}
