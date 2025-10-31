import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ChatChannel {
  id: string;
  household_id: string;
  name?: string;
  type: 'general' | 'direct' | 'group' | 'private';
  icon: string;
  description?: string;
  created_by?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  members?: ChatChannelMember[];
  unread_count?: number;
  last_message?: any;
}

export interface ChatChannelMember {
  id: string;
  channel_id: string;
  member_id: string;
  joined_at: string;
  last_read_at?: string;
  is_muted: boolean;
  // Joined member data
  member_name?: string;
  member_avatar?: string;
}

const CHANNELS_QUERY_KEY = 'chat_channels';

/**
 * Get all channels for the current user's household
 */
export function useChatChannels(householdId?: string) {
  return useQuery({
    queryKey: [CHANNELS_QUERY_KEY, householdId],
    queryFn: async () => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from('chat_channels')
        .select(`
          *,
          members:chat_channel_members(
            id,
            member_id,
            joined_at,
            last_read_at,
            is_muted,
            member:members(name, avatar)
          )
        `)
        .eq('household_id', householdId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ChatChannel[];
    },
    enabled: !!householdId,
  });
}

/**
 * Get a specific channel
 */
export function useChatChannel(channelId?: string) {
  return useQuery({
    queryKey: [CHANNELS_QUERY_KEY, 'single', channelId],
    queryFn: async () => {
      if (!channelId) return null;

      const { data, error } = await supabase
        .from('chat_channels')
        .select(`
          *,
          members:chat_channel_members(
            id,
            member_id,
            joined_at,
            last_read_at,
            is_muted,
            member:members(name, avatar)
          )
        `)
        .eq('id', channelId)
        .single();

      if (error) throw error;
      return data as ChatChannel;
    },
    enabled: !!channelId,
  });
}

/**
 * Create a direct message channel
 */
export function useCreateDirectChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ otherMemberId, householdId }: { otherMemberId: string; householdId: string }) => {
      const { data, error } = await supabase.rpc('create_direct_channel', {
        other_member_uuid: otherMemberId,
      });

      if (error) throw error;
      return { channelId: data, householdId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, result.householdId] });
    },
  });
}

/**
 * Create a group channel
 */
export function useCreateGroupChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      icon,
      memberIds,
      householdId,
    }: {
      name: string;
      icon?: string;
      memberIds: string[];
      householdId: string;
    }) => {
      const { data, error } = await supabase.rpc('create_group_channel', {
        channel_name: name,
        channel_icon: icon || '👥',
        member_uuids: memberIds,
      });

      if (error) throw error;
      return { channelId: data, householdId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, result.householdId] });
    },
  });
}

/**
 * Create a private notes channel
 */
export function useCreatePrivateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ householdId }: { householdId: string }) => {
      const { data, error } = await supabase.rpc('create_private_notes_channel');

      if (error) throw error;
      return { channelId: data, householdId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, result.householdId] });
    },
  });
}

/**
 * Update channel (name, icon, description)
 */
export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      name,
      icon,
      description,
    }: {
      channelId: string;
      name?: string;
      icon?: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('chat_channels')
        .update({
          name,
          icon,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', channelId)
        .select()
        .single();

      if (error) throw error;
      return data as ChatChannel;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, data.household_id] });
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, 'single', data.id] });
    },
  });
}

/**
 * Join a channel
 */
export function useJoinChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      memberId,
      householdId,
    }: {
      channelId: string;
      memberId: string;
      householdId: string;
    }) => {
      const { data, error } = await supabase
        .from('chat_channel_members')
        .insert({
          channel_id: channelId,
          member_id: memberId,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, householdId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, result.householdId] });
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, 'single', result.channel_id] });
    },
  });
}

/**
 * Leave a channel
 */
export function useLeaveChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      memberId,
      householdId,
    }: {
      channelId: string;
      memberId: string;
      householdId: string;
    }) => {
      const { error } = await supabase
        .from('chat_channel_members')
        .delete()
        .eq('channel_id', channelId)
        .eq('member_id', memberId);

      if (error) throw error;
      return { channelId, householdId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, result.householdId] });
    },
  });
}

/**
 * Delete a channel
 */
export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ channelId, householdId }: { channelId: string; householdId: string }) => {
      const { error } = await supabase
        .from('chat_channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
      return { channelId, householdId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, result.householdId] });
    },
  });
}

/**
 * Update last read timestamp for a channel
 */
export function useUpdateLastRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      memberId,
    }: {
      channelId: string;
      memberId: string;
    }) => {
      const { error } = await supabase
        .from('chat_channel_members')
        .update({
          last_read_at: new Date().toISOString(),
        })
        .eq('channel_id', channelId)
        .eq('member_id', memberId);

      if (error) throw error;
      return { channelId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, 'single', result.channelId] });
    },
  });
}

/**
 * Toggle mute for a channel
 */
export function useToggleChannelMute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      memberId,
      isMuted,
    }: {
      channelId: string;
      memberId: string;
      isMuted: boolean;
    }) => {
      const { error } = await supabase
        .from('chat_channel_members')
        .update({
          is_muted: isMuted,
        })
        .eq('channel_id', channelId)
        .eq('member_id', memberId);

      if (error) throw error;
      return { channelId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [CHANNELS_QUERY_KEY, 'single', result.channelId] });
    },
  });
}
