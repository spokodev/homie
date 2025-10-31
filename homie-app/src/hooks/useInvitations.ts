/**
 * Hook for managing household invitations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const QUERY_KEY = 'invitations';

export interface Invitation {
  id: string;
  household_id: string;
  member_id: string | null;
  invite_code: string;
  email: string | null;
  member_name: string;
  status: 'pending' | 'claimed' | 'expired' | 'cancelled';
  invited_by: string;
  created_at: string;
  expires_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
}

export interface CreateInvitationInput {
  household_id: string;
  member_id?: string;
  member_name: string;
  email?: string;
  invited_by: string;
}

/**
 * Get household invitations
 */
export function useHouseholdInvitations(householdId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!householdId,
  });
}

/**
 * Create invitation with auto-generated code
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvitationInput) => {
      // First, generate invite code using the database function
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_invite_code');

      if (codeError) throw codeError;

      // Create the invitation
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          household_id: input.household_id,
          member_id: input.member_id || null,
          invite_code: codeData,
          email: input.email || null,
          member_name: input.member_name,
          invited_by: input.invited_by,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Invitation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.household_id] });
    },
  });
}

/**
 * Check if invitation code is valid
 */
export function useCheckInvitation(code: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'check', code],
    queryFn: async () => {
      if (!code || code.length < 4) return null;

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          household:households(
            id,
            name,
            icon
          )
        `)
        .eq('invite_code', code.toUpperCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No matching invitation found
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!code && code.length >= 4,
    retry: false,
  });
}

/**
 * Claim invitation and join household
 */
export function useClaimInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call the claim_invitation function
      const { data, error } = await supabase
        .rpc('claim_invitation', {
          p_invite_code: inviteCode.toUpperCase(),
          p_user_id: user.id,
        });

      if (error) throw error;

      if (!data || !data[0]) {
        throw new Error('Failed to claim invitation');
      }

      const result = data[0];

      if (!result.success) {
        throw new Error(result.message || 'Failed to claim invitation');
      }

      // Update user metadata with household_id
      if (result.household_id) {
        await supabase.auth.updateUser({
          data: { household_id: result.household_id }
        });
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Cancel invitation (for admins)
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data as Invitation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.household_id] });
    },
  });
}

/**
 * Get active invitations count for household
 */
export function useActiveInvitationsCount(householdId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'count', householdId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', householdId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!householdId,
  });
}