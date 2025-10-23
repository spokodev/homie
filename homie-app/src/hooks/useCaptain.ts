import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

export interface Captain {
  id: string;
  name: string;
  avatar: string;
  started_at: string;
  ends_at: string;
  days_left: number;
  total_ratings: number;
  average_rating: number | null;
  times_captain: number;
}

export interface CaptainRotateInput {
  household_id: string;
  next_captain_id?: string; // Optional: specify next captain, otherwise auto-select
}

const QUERY_KEY = 'captain';

/**
 * Get current captain for a household
 */
export function useCaptain(householdId?: string) {
  const { user } = useAuth();

  return useQuery<Captain | null>({
    queryKey: [QUERY_KEY, householdId],
    queryFn: async () => {
      if (!householdId) return null;

      const { data: household, error } = await supabase
        .from('households')
        .select(`
          captain_member_id,
          captain_started_at,
          captain_ends_at,
          captain_total_ratings,
          captain_average_rating,
          captain:members!households_captain_member_id_fkey(
            id,
            name,
            avatar,
            times_captain
          )
        `)
        .eq('id', householdId)
        .single();

      if (error) throw error;
      if (!household?.captain_member_id || !household.captain) return null;

      const captain = Array.isArray(household.captain)
        ? household.captain[0]
        : household.captain;

      // Calculate days left
      const now = new Date();
      const endsAt = new Date(household.captain_ends_at);
      const daysLeft = Math.max(
        0,
        Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        id: captain.id,
        name: captain.name,
        avatar: captain.avatar,
        started_at: household.captain_started_at,
        ends_at: household.captain_ends_at,
        days_left: daysLeft,
        total_ratings: household.captain_total_ratings || 0,
        average_rating: household.captain_average_rating
          ? parseFloat(household.captain_average_rating)
          : null,
        times_captain: captain.times_captain || 0,
      };
    },
    enabled: !!householdId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Check if captain rotation is needed
 * Returns true if current captain's rotation has ended
 */
export function useNeedsCaptainRotation(householdId?: string) {
  const { data: captain } = useCaptain(householdId);

  if (!captain) return false;

  const now = new Date();
  const endsAt = new Date(captain.ends_at);

  return now > endsAt;
}

/**
 * Rotate to next captain
 * NOTE: In production, this should be called by a backend cron job
 * For MVP, we'll allow manual rotation from the frontend
 */
export function useRotateCaptain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ household_id, next_captain_id }: CaptainRotateInput) => {
      let selectedCaptainId = next_captain_id;

      // If no captain specified, select next captain automatically
      if (!selectedCaptainId) {
        // Get all human members ordered by times_captain (least to most)
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('id, times_captain')
          .eq('household_id', household_id)
          .eq('type', 'human')
          .order('times_captain', { ascending: true, nullsFirst: true });

        if (membersError) throw membersError;
        if (!members || members.length === 0) {
          throw new Error('No members available to be captain');
        }

        // Pick the member who has been captain the least
        selectedCaptainId = members[0].id;
      }

      const now = new Date();
      const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Update household with new captain
      const { error: householdError } = await supabase
        .from('households')
        .update({
          captain_member_id: selectedCaptainId,
          captain_started_at: now.toISOString(),
          captain_ends_at: endsAt.toISOString(),
          captain_total_ratings: 0,
          captain_average_rating: null,
        })
        .eq('id', household_id);

      if (householdError) throw householdError;

      // Increment times_captain for the new captain
      const { error: memberError } = await supabase.rpc('increment_times_captain', {
        member_uuid: selectedCaptainId,
      });

      // If RPC doesn't exist, do it manually
      if (memberError) {
        const { data: member } = await supabase
          .from('members')
          .select('times_captain')
          .eq('id', selectedCaptainId)
          .single();

        const newCount = (member?.times_captain || 0) + 1;

        await supabase
          .from('members')
          .update({ times_captain: newCount })
          .eq('id', selectedCaptainId);
      }

      return { captain_id: selectedCaptainId, started_at: now, ends_at: endsAt };
    },
    onSuccess: (data, variables) => {
      // Track captain rotation
      trackEvent(ANALYTICS_EVENTS.CAPTAIN_ROTATED, {
        household_id: variables.household_id,
        captain_id: data.captain_id,
        manual_selection: !!variables.next_captain_id,
      });

      // Invalidate captain query
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.household_id] });
      queryClient.invalidateQueries({ queryKey: ['members', variables.household_id] });
    },
  });
}

/**
 * Get captain stats for a member
 */
export function useCaptainStats(memberId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['captain-stats', memberId],
    queryFn: async () => {
      if (!memberId) return null;

      const { data, error } = await supabase
        .from('members')
        .select('times_captain, captain_average_rating')
        .eq('id', memberId)
        .single();

      if (error) throw error;

      return {
        times_captain: data.times_captain || 0,
        average_rating: data.captain_average_rating
          ? parseFloat(data.captain_average_rating)
          : null,
      };
    },
    enabled: !!memberId && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
