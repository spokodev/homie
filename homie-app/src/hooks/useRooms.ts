import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Room {
  id: string;
  household_id: string;
  name: string;
  icon: string;
  created_at: string;
  notes_count?: number;
}

export interface CreateRoomInput {
  household_id: string;
  name: string;
  icon: string;
}

export interface UpdateRoomInput {
  name?: string;
  icon?: string;
}

const QUERY_KEY = 'rooms';

/**
 * Fetch all rooms for a household
 */
export function useRooms(householdId?: string) {
  const { user } = useAuth();

  return useQuery<Room[]>({
    queryKey: [QUERY_KEY, householdId],
    queryFn: async () => {
      if (!householdId) return [];

      // Fetch rooms with notes count
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_notes(count)
        `)
        .eq('household_id', householdId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform to include notes count
      return (data || []).map((room: any) => ({
        ...room,
        notes_count: room.room_notes?.[0]?.count || 0,
      }));
    },
    enabled: !!householdId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get a single room by ID
 */
export function useRoom(roomId?: string) {
  const { user } = useAuth();

  return useQuery<Room>({
    queryKey: [QUERY_KEY, 'single', roomId],
    queryFn: async () => {
      if (!roomId) throw new Error('Room ID required');

      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_notes(count)
        `)
        .eq('id', roomId)
        .single();

      if (error) throw error;

      return {
        ...data,
        notes_count: data.room_notes?.[0]?.count || 0,
      };
    },
    enabled: !!roomId && !!user,
  });
}

/**
 * Create a new room
 */
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRoomInput) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          household_id: input.household_id,
          name: input.name,
          icon: input.icon,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Room;
    },
    onSuccess: () => {
      // Invalidate rooms queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Update an existing room
 */
export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateRoomInput }) => {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Delete a room
 */
export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, householdId }: { roomId: string; householdId: string }) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
      return { roomId, householdId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
