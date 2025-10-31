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
  edited_at?: string;
  reply_to_id?: string;
  reply_to?: {
    id: string;
    content: string;
    member_name: string;
  };
}

export interface SendMessageInput {
  household_id: string;
  member_id: string;
  content: string;
  type?: 'text' | 'image' | 'system';
  image_url?: string;
  channel_id?: string;
  reply_to_id?: string;
}

const QUERY_KEY = 'messages';
const MESSAGES_LIMIT = 100;

/**
 * Fetch messages for a household with real-time updates
 * If channelId is provided, only fetch messages for that channel
 */
export function useMessages(householdId?: string, channelId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const query = useQuery<Message[]>({
    queryKey: [QUERY_KEY, householdId, channelId],
    queryFn: async () => {
      if (!householdId) return [];

      let query = supabase
        .from('messages')
        .select(`
          *,
          member:members!messages_member_id_fkey(
            id,
            name,
            avatar
          )
        `)
        .eq('household_id', householdId);

      // Filter by channel if provided
      if (channelId) {
        query = query.eq('channel_id', channelId);
      } else {
        // If no channel specified, get messages without channel (legacy household-wide)
        query = query.is('channel_id', null);
      }

      const { data, error } = await query
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

    // Build filter based on channel
    let filter = `household_id=eq.${householdId}`;
    if (channelId) {
      filter += `,channel_id=eq.${channelId}`;
    }

    // Create new subscription
    const channel = supabase
      .channel(`messages:${householdId}${channelId ? `:${channelId}` : ''}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter,
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
              [QUERY_KEY, householdId, channelId],
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
  }, [householdId, channelId, user, queryClient]);

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
          channel_id: input.channel_id || null,
          reply_to_id: input.reply_to_id || null,
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
    onMutate: async (input: any) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, input.household_id, input.channel_id] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>([
        QUERY_KEY,
        input.household_id,
        input.channel_id,
      ]);

      // Optimistically update with temporary message including member details
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        household_id: input.household_id,
        member_id: input.member_id,
        member_name: input.member_name,
        member_avatar: input.member_avatar,
        content: input.content,
        type: input.type || 'text',
        image_url: input.image_url,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(
        [QUERY_KEY, input.household_id, input.channel_id],
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
          [QUERY_KEY, input.household_id, input.channel_id],
          context.previousMessages
        );
      }
    },
    onSuccess: (data, input) => {
      // Replace temp message with real one
      queryClient.setQueryData<Message[]>(
        [QUERY_KEY, input.household_id, input.channel_id],
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
    mutationFn: async ({
      messageId,
      householdId,
      channelId,
    }: {
      messageId: string;
      householdId: string;
      channelId?: string;
    }) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return { messageId, householdId, channelId };
    },
    onSuccess: (result) => {
      // Invalidate all message queries for this household
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, result.householdId] });
    },
  });
}

/**
 * Edit a message
 */
export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      content,
      householdId,
      channelId,
    }: {
      messageId: string;
      content: string;
      householdId: string;
      channelId?: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          content,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return { data, householdId, channelId };
    },
    onSuccess: (result) => {
      // Invalidate all message queries for this household
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, result.householdId] });
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
