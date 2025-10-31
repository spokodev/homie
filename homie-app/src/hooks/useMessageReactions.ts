import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MessageReaction {
  emoji: string;
  count: number;
  member_ids: string[];
  member_names: string[];
}

const REACTIONS_QUERY_KEY = 'message_reactions';

/**
 * Get reactions for a specific message
 */
export function useMessageReactions(messageId?: string) {
  return useQuery({
    queryKey: [REACTIONS_QUERY_KEY, messageId],
    queryFn: async () => {
      if (!messageId) return [];

      const { data, error } = await supabase.rpc('get_message_reactions', {
        message_uuid: messageId,
      });

      if (error) throw error;
      return (data || []) as MessageReaction[];
    },
    enabled: !!messageId,
  });
}

/**
 * Toggle a reaction on a message (add if not exists, remove if exists)
 */
export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
      householdId,
    }: {
      messageId: string;
      emoji: string;
      householdId: string;
    }) => {
      const { data, error } = await supabase.rpc('toggle_message_reaction', {
        message_uuid: messageId,
        reaction_emoji: emoji,
      });

      if (error) throw error;
      return { ...data, messageId, householdId };
    },
    onSuccess: (result) => {
      // Invalidate reactions for this message
      queryClient.invalidateQueries({
        queryKey: [REACTIONS_QUERY_KEY, result.messageId],
      });
      // Invalidate messages list to update reaction counts
      queryClient.invalidateQueries({
        queryKey: ['messages', result.householdId],
      });
    },
  });
}

/**
 * Common emoji reactions
 */
export const COMMON_REACTIONS = [
  '👍', // thumbs up
  '❤️', // heart
  '😂', // laughing
  '😮', // surprised
  '😢', // sad
  '🎉', // party
  '🔥', // fire
  '👏', // clap
];
