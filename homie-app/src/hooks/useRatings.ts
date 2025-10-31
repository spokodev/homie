import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { APP_CONFIG } from '@/constants';

export interface CaptainRating {
  id: string;
  household_id: string;
  captain_member_id: string;
  captain_name: string;
  captain_avatar: string;
  rated_by_member_id: string;
  rated_by_name: string;
  rated_by_avatar: string;
  rating: number;
  comment: string | null;
  rotation_start: string;
  rotation_end: string;
  created_at: string;
}

export interface CreateRatingInput {
  household_id: string;
  captain_member_id: string;
  rated_by_member_id: string;
  rating: number; // 1-5
  comment?: string;
  rotation_start: string;
  rotation_end: string;
}

const QUERY_KEY = 'captain-ratings';

/**
 * Get all ratings for a captain's rotation
 */
export function useCaptainRotationRatings(
  captainMemberId?: string,
  rotationStart?: string
) {
  const { user } = useAuth();

  return useQuery<CaptainRating[]>({
    queryKey: [QUERY_KEY, 'rotation', captainMemberId, rotationStart],
    queryFn: async () => {
      if (!captainMemberId || !rotationStart) return [];

      const { data, error } = await supabase
        .from('captain_ratings')
        .select(`
          *,
          captain:members!captain_ratings_captain_member_id_fkey(name, avatar),
          rater:members!captain_ratings_rated_by_member_id_fkey(name, avatar)
        `)
        .eq('captain_member_id', captainMemberId)
        .eq('rotation_start', rotationStart)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((rating: any) => ({
        ...rating,
        captain_name: rating.captain?.name || 'Unknown',
        captain_avatar: rating.captain?.avatar || '😊',
        rated_by_name: rating.rater?.name || 'Unknown',
        rated_by_avatar: rating.rater?.avatar || '😊',
      }));
    },
    enabled: !!captainMemberId && !!rotationStart && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get rating history for a captain (all rotations)
 */
export function useCaptainRatingHistory(captainMemberId?: string) {
  const { user } = useAuth();

  return useQuery<CaptainRating[]>({
    queryKey: [QUERY_KEY, 'history', captainMemberId],
    queryFn: async () => {
      if (!captainMemberId) return [];

      const { data, error } = await supabase
        .from('captain_ratings')
        .select(`
          *,
          captain:members!captain_ratings_captain_member_id_fkey(name, avatar),
          rater:members!captain_ratings_rated_by_member_id_fkey(name, avatar)
        `)
        .eq('captain_member_id', captainMemberId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((rating: any) => ({
        ...rating,
        captain_name: rating.captain?.name || 'Unknown',
        captain_avatar: rating.captain?.avatar || '😊',
        rated_by_name: rating.rater?.name || 'Unknown',
        rated_by_avatar: rating.rater?.avatar || '😊',
      }));
    },
    enabled: !!captainMemberId && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Check if current member has already rated the captain for this rotation
 */
export function useHasRatedCaptain(
  householdId?: string,
  captainMemberId?: string,
  currentMemberId?: string,
  rotationStart?: string
) {
  const { user } = useAuth();

  return useQuery<boolean>({
    queryKey: [
      QUERY_KEY,
      'has-rated',
      householdId,
      captainMemberId,
      currentMemberId,
      rotationStart,
    ],
    queryFn: async () => {
      if (!householdId || !captainMemberId || !currentMemberId || !rotationStart) {
        return false;
      }

      const { data, error } = await supabase
        .from('captain_ratings')
        .select('id')
        .eq('household_id', householdId)
        .eq('captain_member_id', captainMemberId)
        .eq('rated_by_member_id', currentMemberId)
        .eq('rotation_start', rotationStart)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      return !!data;
    },
    enabled: !!householdId && !!captainMemberId && !!currentMemberId && !!rotationStart && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Submit a rating for the current captain
 */
export function useRateCaptain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRatingInput) => {
      // Validate rating
      if (input.rating < 1 || input.rating > 5) {
        throw new Error('Rating must be between 1 and 5 stars');
      }

      // Check if already rated
      const { data: existing } = await supabase
        .from('captain_ratings')
        .select('id')
        .eq('household_id', input.household_id)
        .eq('captain_member_id', input.captain_member_id)
        .eq('rated_by_member_id', input.rated_by_member_id)
        .eq('rotation_start', input.rotation_start)
        .maybeSingle();

      if (existing) {
        throw new Error('You have already rated this captain for this rotation');
      }

      // Insert rating
      const { data: rating, error: insertError } = await supabase
        .from('captain_ratings')
        .insert({
          household_id: input.household_id,
          captain_member_id: input.captain_member_id,
          rated_by_member_id: input.rated_by_member_id,
          rating: input.rating,
          comment: input.comment || null,
          rotation_start: input.rotation_start,
          rotation_end: input.rotation_end,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Recalculate household captain rating stats
      // Include the newly inserted rating by querying again after insert
      const { data: allRatings } = await supabase
        .from('captain_ratings')
        .select('rating')
        .eq('captain_member_id', input.captain_member_id)
        .eq('rotation_start', input.rotation_start);

      if (allRatings && allRatings.length > 0) {
        // The new rating should be included in allRatings now
        const totalRatings = allRatings.length;
        const sumRatings = allRatings.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = sumRatings / totalRatings;

        // Update household with new stats
        await supabase
          .from('households')
          .update({
            captain_total_ratings: totalRatings,
            captain_average_rating: avgRating.toFixed(2),
          })
          .eq('id', input.household_id);

        // If rating is high, award bonus points
        if (input.rating >= 4) {
          const bonusPoints = input.rating * APP_CONFIG.game.captainRatingMultiplier;

          const { data: captain } = await supabase
            .from('members')
            .select('points')
            .eq('id', input.captain_member_id)
            .single();

          if (captain) {
            await supabase
              .from('members')
              .update({ points: (captain.points || 0) + bonusPoints })
              .eq('id', input.captain_member_id);
          }
        }

        // Update captain's lifetime average rating
        const { data: allCaptainRatings } = await supabase
          .from('captain_ratings')
          .select('rating')
          .eq('captain_member_id', input.captain_member_id);

        if (allCaptainRatings && allCaptainRatings.length > 0) {
          const totalAllRatings = allCaptainRatings.length;
          const sumAllRatings = allCaptainRatings.reduce((sum, r) => sum + r.rating, 0);
          const avgAllRatings = sumAllRatings / totalAllRatings;

          await supabase
            .from('members')
            .update({ captain_average_rating: avgAllRatings.toFixed(2) })
            .eq('id', input.captain_member_id);
        }
      }

      return rating;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'rotation', variables.captain_member_id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'history', variables.captain_member_id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'has-rated'],
      });
      queryClient.invalidateQueries({ queryKey: ['captain', variables.household_id] });
      queryClient.invalidateQueries({ queryKey: ['members', variables.household_id] });
      queryClient.invalidateQueries({
        queryKey: ['captain-stats', variables.captain_member_id],
      });
    },
  });
}
