import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface NotificationPreferences {
  id: string;
  member_id: string;
  task_assigned: boolean;
  task_completed: boolean;
  task_due_soon: boolean;
  new_message: boolean;
  captain_rotation: boolean;
  rating_request: boolean;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = 'notification_preferences';

/**
 * Get notification preferences for a member
 */
export function useNotificationPreferences(memberId?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, memberId],
    queryFn: async () => {
      if (!memberId) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('member_id', memberId)
        .single();

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newPrefs, error: createError } = await supabase
            .from('notification_preferences')
            .insert({ member_id: memberId })
            .select()
            .single();

          if (createError) throw createError;
          return newPrefs as NotificationPreferences;
        }
        throw error;
      }

      return data as NotificationPreferences;
    },
    enabled: !!memberId,
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      preferences,
    }: {
      memberId: string;
      preferences: Partial<NotificationPreferences>;
    }) => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('member_id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEY, data.member_id], data);
    },
  });
}

/**
 * Toggle a specific notification type
 */
export function useToggleNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      type,
      enabled,
    }: {
      memberId: string;
      type: keyof Omit<NotificationPreferences, 'id' | 'member_id' | 'created_at' | 'updated_at'>;
      enabled: boolean;
    }) => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          [type]: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('member_id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEY, data.member_id], data);
    },
  });
}

/**
 * Get notification history for a member
 */
export function useNotificationHistory(memberId?: string) {
  return useQuery({
    queryKey: ['notification_history', memberId],
    queryFn: async () => {
      if (!memberId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('member_id', memberId)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });
}

/**
 * Mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      notificationId,
      memberId,
    }: {
      notificationId: string;
      memberId: string;
    }) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return { data, memberId };
    },
    onSuccess: ({ memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['notification_history', memberId] });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('member_id', memberId)
        .is('read_at', null);

      if (error) throw error;
      return memberId;
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['notification_history', memberId] });
    },
  });
}
