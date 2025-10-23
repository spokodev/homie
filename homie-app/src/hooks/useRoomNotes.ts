import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePremiumStore } from '@/stores/premium.store';

export interface RoomNote {
  id: string;
  room_id: string;
  member_id: string;
  member_name?: string;
  member_avatar?: string;
  content: string;
  color: string;
  image_url?: string;
  is_pinned: boolean;
  expires_at?: string;
  created_at: string;
}

export interface CreateRoomNoteInput {
  room_id: string;
  member_id: string;
  content: string;
  color?: string;
  image_url?: string;
  is_pinned?: boolean;
  expires_at?: string;
}

export interface UpdateRoomNoteInput {
  content?: string;
  color?: string;
  image_url?: string;
  is_pinned?: boolean;
  expires_at?: string;
}

const QUERY_KEY = 'room-notes';
const FREE_NOTES_LIMIT = 3;

/**
 * Fetch all notes for a room
 */
export function useRoomNotes(roomId?: string) {
  const { user } = useAuth();

  return useQuery<RoomNote[]>({
    queryKey: [QUERY_KEY, roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from('room_notes')
        .select(`
          *,
          member:members!room_notes_member_id_fkey(
            id,
            name,
            avatar
          )
        `)
        .eq('room_id', roomId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include member details
      return (data || []).map((note: any) => ({
        ...note,
        member_name: note.member?.name,
        member_avatar: note.member?.avatar,
      }));
    },
    enabled: !!roomId && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Create a new room note
 */
export function useCreateRoomNote() {
  const queryClient = useQueryClient();
  const isPremium = usePremiumStore((state) => state.isPremium);

  return useMutation({
    mutationFn: async (input: CreateRoomNoteInput) => {
      // Check note limit for free users
      if (!isPremium) {
        const { data: existingNotes, error: countError } = await supabase
          .from('room_notes')
          .select('id')
          .eq('room_id', input.room_id);

        if (countError) throw countError;

        if (existingNotes && existingNotes.length >= FREE_NOTES_LIMIT) {
          throw new Error(`Free users can only have ${FREE_NOTES_LIMIT} notes per room. Upgrade to Premium for unlimited notes!`);
        }
      }

      const { data, error } = await supabase
        .from('room_notes')
        .insert({
          room_id: input.room_id,
          member_id: input.member_id,
          content: input.content,
          color: input.color || '#FFD93D',
          image_url: input.image_url,
          is_pinned: input.is_pinned || false,
          expires_at: input.expires_at,
        })
        .select(`
          *,
          member:members!room_notes_member_id_fkey(
            id,
            name,
            avatar
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        member_name: data.member?.name,
        member_avatar: data.member?.avatar,
      } as RoomNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.room_id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

/**
 * Update an existing room note
 */
export function useUpdateRoomNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      roomId,
      updates,
    }: {
      id: string;
      roomId: string;
      updates: UpdateRoomNoteInput;
    }) => {
      const { data, error } = await supabase
        .from('room_notes')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          member:members!room_notes_member_id_fkey(
            id,
            name,
            avatar
          )
        `)
        .single();

      if (error) throw error;

      return {
        ...data,
        member_name: data.member?.name,
        member_avatar: data.member?.avatar,
      } as RoomNote;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.roomId] });
    },
  });
}

/**
 * Toggle pin status of a note
 */
export function useTogglePinNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isPinned,
    }: {
      id: string;
      roomId: string;
      isPinned: boolean;
    }) => {
      const { error } = await supabase
        .from('room_notes')
        .update({ is_pinned: isPinned })
        .eq('id', id);

      if (error) throw error;
      return { id, isPinned };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.roomId] });
    },
  });
}

/**
 * Delete a room note
 */
export function useDeleteRoomNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, roomId }: { noteId: string; roomId: string }) => {
      const { error } = await supabase
        .from('room_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      return { noteId, roomId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
