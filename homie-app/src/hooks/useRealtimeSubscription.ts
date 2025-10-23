import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

interface UseRealtimeSubscriptionOptions {
  table: string;
  event?: RealtimeEvent | '*';
  filter?: string;
  queryKey: any[];
  enabled?: boolean;
}

/**
 * Subscribe to real-time changes from Supabase and invalidate React Query cache
 */
export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  queryKey,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    console.log(`[Realtime] Subscribing to ${table} ${event}`);

    // Build subscription
    let subscription = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          filter,
        } as any,
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(`[Realtime] ${table} change:`, payload.eventType);

          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log(`[Realtime] Unsubscribing from ${table}`);
      subscription.unsubscribe();
    };
  }, [table, event, filter, enabled, queryClient, queryKey]);
}

/**
 * Subscribe to task changes for a household
 */
export function useTasksRealtime(householdId?: string) {
  useRealtimeSubscription({
    table: 'tasks',
    queryKey: ['tasks', householdId],
    filter: householdId ? `household_id=eq.${householdId}` : undefined,
    enabled: !!householdId,
  });
}

/**
 * Subscribe to member changes for a household
 */
export function useMembersRealtime(householdId?: string) {
  useRealtimeSubscription({
    table: 'members',
    queryKey: ['members', householdId],
    filter: householdId ? `household_id=eq.${householdId}` : undefined,
    enabled: !!householdId,
  });
}

/**
 * Subscribe to message changes for a household
 */
export function useMessagesRealtime(householdId?: string) {
  useRealtimeSubscription({
    table: 'messages',
    queryKey: ['messages', householdId],
    filter: householdId ? `household_id=eq.${householdId}` : undefined,
    enabled: !!householdId,
  });
}

/**
 * Subscribe to household changes
 */
export function useHouseholdRealtime(householdId?: string) {
  useRealtimeSubscription({
    table: 'households',
    queryKey: ['households'],
    filter: householdId ? `id=eq.${householdId}` : undefined,
    enabled: !!householdId,
  });
}
