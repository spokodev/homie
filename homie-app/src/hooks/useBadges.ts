import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { checkNewBadges, Badge, BadgeCriteria, getAllBadges } from '@/utils/badges';
import { logError } from '@/utils/errorHandling';

export interface MemberBadge {
  id: string;
  member_id: string;
  badge_id: string;
  earned_at: string;
}

/**
 * Fetch member's earned badges
 */
export function useMemberBadges(memberId?: string) {
  return useQuery({
    queryKey: ['member-badges', memberId],
    queryFn: async () => {
      if (!memberId) return [];

      const { data, error } = await supabase
        .from('member_badges')
        .select('*')
        .eq('member_id', memberId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as MemberBadge[];
    },
    enabled: !!memberId,
  });
}

/**
 * Award a badge to a member
 */
export function useAwardBadge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      badgeId,
    }: {
      memberId: string;
      badgeId: string;
    }) => {
      // Check if already earned
      const { data: existing } = await supabase
        .from('member_badges')
        .select('id')
        .eq('member_id', memberId)
        .eq('badge_id', badgeId)
        .single();

      if (existing) {
        return null; // Already has this badge
      }

      // Award badge
      const { data, error } = await supabase
        .from('member_badges')
        .insert({
          member_id: memberId,
          badge_id: badgeId,
          earned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as MemberBadge;
    },
    onSuccess: (data, variables) => {
      if (data) {
        // Invalidate member badges cache
        queryClient.invalidateQueries({
          queryKey: ['member-badges', variables.memberId],
        });
      }
    },
    onError: (error) => {
      logError(error, 'Award Badge');
    },
  });
}

/**
 * Check for new badges and award them
 */
export function useCheckAndAwardBadges() {
  const awardBadge = useAwardBadge();

  return useMutation({
    mutationFn: async ({
      memberId,
      memberStats,
      earnedBadgeIds,
      isPremium,
    }: {
      memberId: string;
      memberStats: BadgeCriteria;
      earnedBadgeIds: string[];
      isPremium: boolean;
    }) => {
      // Check which new badges can be awarded
      const newBadges = checkNewBadges(memberStats, earnedBadgeIds, isPremium);

      // Award each new badge
      const awardedBadges: Badge[] = [];
      for (const badge of newBadges) {
        try {
          const result = await awardBadge.mutateAsync({
            memberId,
            badgeId: badge.id,
          });

          if (result) {
            awardedBadges.push(badge);
          }
        } catch (error) {
          logError(error, `Award Badge ${badge.id}`);
        }
      }

      return awardedBadges;
    },
  });
}

/**
 * Get member's badge statistics
 */
export function useBadgeStats(memberId?: string, isPremium: boolean = false) {
  const { data: memberBadges = [] } = useMemberBadges(memberId);

  const allBadges = getAllBadges(isPremium);
  const earnedCount = memberBadges.length;
  const totalCount = allBadges.length;
  const progress = totalCount > 0 ? earnedCount / totalCount : 0;

  return {
    earnedCount,
    totalCount,
    progress,
    earnedBadgeIds: memberBadges.map(b => b.badge_id),
  };
}

/**
 * Get badges grouped by earned/locked
 */
export function useGroupedBadges(memberId?: string, isPremium: boolean = false) {
  const { data: memberBadges = [] } = useMemberBadges(memberId);
  const allBadges = getAllBadges(isPremium);

  const earnedBadgeIds = memberBadges.map(mb => mb.badge_id);

  const earned = allBadges.filter(badge => earnedBadgeIds.includes(badge.id));
  const locked = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));

  return {
    earned,
    locked,
    all: allBadges,
  };
}
