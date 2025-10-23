import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../useRooms';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock Auth Context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    session: { access_token: 'token' },
    loading: false,
  }),
}));

describe('useRooms Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useRooms - Fetch Rooms', () => {
    it('should fetch rooms successfully with notes count', async () => {
      const mockRooms = [
        {
          id: 'room-1',
          household_id: 'household-123',
          name: 'Living Room',
          icon: '🛋️',
          created_at: '2024-01-01T10:00:00Z',
          room_notes: [{ count: 3 }],
        },
        {
          id: 'room-2',
          household_id: 'household-123',
          name: 'Kitchen',
          icon: '🍳',
          created_at: '2024-01-01T10:01:00Z',
          room_notes: [{ count: 1 }],
        },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockRooms, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useRooms('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].name).toBe('Living Room');
      expect(result.current.data?.[0].notes_count).toBe(3);
      expect(result.current.data?.[1].notes_count).toBe(1);
    });

    it('should handle rooms with no notes', async () => {
      const mockRooms = [
        {
          id: 'room-1',
          household_id: 'household-123',
          name: 'Bedroom',
          icon: '🛏️',
          created_at: '2024-01-01T10:00:00Z',
          room_notes: [],
        },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockRooms, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useRooms('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].notes_count).toBe(0);
    });

    it('should handle fetch error', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useRooms('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useCreateRoom - Create Room', () => {
    it('should create room successfully', async () => {
      const newRoom = {
        id: 'room-new',
        household_id: 'household-123',
        name: 'Office',
        icon: '💻',
        created_at: '2024-01-01T10:02:00Z',
      };

      const mockFrom = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: newRoom, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCreateRoom(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          household_id: 'household-123',
          name: 'Office',
          icon: '💻',
        });
      });

      expect(mockFrom.insert).toHaveBeenCalledWith({
        household_id: 'household-123',
        name: 'Office',
        icon: '💻',
      });
    });

    it('should handle create error', async () => {
      const mockFrom = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Create failed')),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCreateRoom(), { wrapper });

      await expect(
        result.current.mutateAsync({
          household_id: 'household-123',
          name: 'Office',
          icon: '💻',
        })
      ).rejects.toThrow('Create failed');
    });
  });

  describe('useUpdateRoom - Update Room', () => {
    it('should update room successfully', async () => {
      const updatedRoom = {
        id: 'room-1',
        household_id: 'household-123',
        name: 'Living Area',
        icon: '🏠',
        created_at: '2024-01-01T10:00:00Z',
      };

      const mockFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedRoom, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useUpdateRoom(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'room-1',
          updates: { name: 'Living Area', icon: '🏠' },
        });
      });

      expect(mockFrom.update).toHaveBeenCalledWith({ name: 'Living Area', icon: '🏠' });
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'room-1');
    });

    it('should handle update error', async () => {
      const mockFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Update failed')),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useUpdateRoom(), { wrapper });

      await expect(
        result.current.mutateAsync({
          id: 'room-1',
          updates: { name: 'Living Area' },
        })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('useDeleteRoom - Delete Room', () => {
    it('should delete room successfully', async () => {
      const mockFrom = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useDeleteRoom(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          roomId: 'room-1',
          householdId: 'household-123',
        });
      });

      expect(mockFrom.delete).toHaveBeenCalled();
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'room-1');
    });

    it('should handle delete error', async () => {
      const mockFrom = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useDeleteRoom(), { wrapper });

      await expect(
        result.current.mutateAsync({
          roomId: 'room-1',
          householdId: 'household-123',
        })
      ).rejects.toThrow('Delete failed');
    });
  });
});
