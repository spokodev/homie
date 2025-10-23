import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  household_id: string;
  member_id: string;
  member_name?: string;
  member_avatar?: string;
  content: string;
  type: 'text' | 'image' | 'system';
  image_url?: string;
  created_at: string;
}

export interface SendMessageInput {
  household_id: string;
  member_id: string;
  content: string;
  type?: 'text' | 'image' | 'system';
  image_url?: string;
}

const QUERY_KEY = 'messages';
const MESSAGES_LIMIT = 100;

/**
 * Fetch messages for a household with real-time updates
 */
export function useMessages(householdId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const query = useQuery<Message[]>({
    queryKey: [QUERY_KEY, householdId],
    queryFn: async () => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          member:members!messages_member_id_fkey(
            id,
            name,
            avatar
          )
        `)
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_LIMIT);

      if (error) throw error;

      // Transform data to include member details
      return (data || []).map((message: any) => ({
        ...message,
        member_name: message.member?.name,
        member_avatar: message.member?.avatar,
      })).reverse(); // Reverse to show oldest first
    },
    enabled: !!householdId && !!user,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!householdId || !user) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new subscription
    const channel = supabase
      .channel(`messages:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `household_id=eq.${householdId}`,
        },
        async (payload) => {
          // Fetch the full message with member details
          const { data: newMessage, error } = await supabase
            .from('messages')
            .select(`
              *,
              member:members!messages_member_id_fkey(
                id,
                name,
                avatar
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && newMessage) {
            const transformedMessage: Message = {
              ...newMessage,
              member_name: newMessage.member?.name,
              member_avatar: newMessage.member?.avatar,
            };

            // Optimistically add to cache
            queryClient.setQueryData<Message[]>(
              [QUERY_KEY, householdId],
              (old) => {
                if (!old) return [transformedMessage];
                // Avoid duplicates
                if (old.some((msg) => msg.id === transformedMessage.id)) {
                  return old;
                }
                return [...old, transformedMessage];
              }
            );
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [householdId, user, queryClient]);

  return query;
}

/**
 * Send a new message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendMessageInput) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          household_id: input.household_id,
          member_id: input.member_id,
          content: input.content,
          type: input.type || 'text',
          image_url: input.image_url,
        })
        .select(`
          *,
          member:members!messages_member_id_fkey(
            id,
            name,
            avatar
          )
        `)
        .single();

      if (error) throw error;

      // Transform the response
      return {
        ...data,
        member_name: data.member?.name,
        member_avatar: data.member?.avatar,
      } as Message;
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, input.household_id] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>([
        QUERY_KEY,
        input.household_id,
      ]);

      // Optimistically update with temporary message
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        household_id: input.household_id,
        member_id: input.member_id,
        content: input.content,
        type: input.type || 'text',
        image_url: input.image_url,
        created_at: new Date().toISOString(),
        // Member details will be populated by real-time subscription
      };

      queryClient.setQueryData<Message[]>(
        [QUERY_KEY, input.household_id],
        (old) => {
          if (!old) return [tempMessage];
          return [...old, tempMessage];
        }
      );

      return { previousMessages };
    },
    onError: (_err, input, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          [QUERY_KEY, input.household_id],
          context.previousMessages
        );
      }
    },
    onSuccess: (data, input) => {
      // Replace temp message with real one
      queryClient.setQueryData<Message[]>(
        [QUERY_KEY, input.household_id],
        (old) => {
          if (!old) return [data];

          // Remove temp message and add real one
          const filtered = old.filter((msg) => !msg.id.startsWith('temp-'));

          // Avoid duplicates
          if (filtered.some((msg) => msg.id === data.id)) {
            return filtered;
          }

          return [...filtered, data];
        }
      );
    },
  });
}

/**
 * Delete a message (admin only)
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, householdId }: { messageId: string; householdId: string }) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return { messageId, householdId };
    },
    onSuccess: (result) => {
      // Remove message from cache
      queryClient.setQueryData<Message[]>(
        [QUERY_KEY, result.householdId],
        (old) => {
          if (!old) return [];
          return old.filter((msg) => msg.id !== result.messageId);
        }
      );
    },
  });
}

/**
 * Send a system message (automated notifications)
 */
export async function sendSystemMessage(
  householdId: string,
  content: string
): Promise<void> {
  await supabase
    .from('messages')
    .insert({
      household_id: householdId,
      member_id: null, // System messages don't have a member
      content,
      type: 'system',
    });
}
