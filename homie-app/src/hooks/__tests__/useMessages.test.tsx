import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMessages, useSendMessage, useDeleteMessage } from '../useMessages';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    removeChannel: jest.fn(),
    channel: jest.fn(),
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

describe('useMessages Integration Tests', () => {
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

  describe('useMessages - Fetch Messages', () => {
    it('should fetch messages successfully', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          household_id: 'household-123',
          member_id: 'member-123',
          content: 'Hello!',
          type: 'text',
          created_at: '2024-01-01T10:00:00Z',
          member: { id: 'member-123', name: 'John', avatar: '😊' },
        },
        {
          id: 'msg-2',
          household_id: 'household-123',
          member_id: 'member-456',
          content: 'Hi there!',
          type: 'text',
          created_at: '2024-01-01T10:01:00Z',
          member: { id: 'member-456', name: 'Jane', avatar: '👩' },
        },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockMessages, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useMessages('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].content).toBe('Hello!');
      expect(result.current.data?.[0].member_name).toBe('John');
      expect(result.current.data?.[1].member_name).toBe('Jane');
    });

    it('should handle empty messages', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useMessages('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle fetch error', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useMessages('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useSendMessage - Send Message', () => {
    it('should send message successfully', async () => {
      const newMessage = {
        id: 'msg-new',
        household_id: 'household-123',
        member_id: 'member-123',
        content: 'New message',
        type: 'text' as const,
        created_at: '2024-01-01T10:02:00Z',
        member: { id: 'member-123', name: 'John', avatar: '😊' },
      };

      const mockFrom = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: newMessage, error: null }),
        single: jest.fn(),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          household_id: 'household-123',
          member_id: 'member-123',
          content: 'New message',
          type: 'text',
        });
      });

      expect(mockFrom.insert).toHaveBeenCalledWith({
        household_id: 'household-123',
        member_id: 'member-123',
        content: 'New message',
        type: 'text',
        image_url: undefined,
      });
    });

    it('should handle send error', async () => {
      const mockFrom = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockRejectedValue(new Error('Send failed')),
        single: jest.fn(),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useSendMessage(), { wrapper });

      await expect(
        result.current.mutateAsync({
          household_id: 'household-123',
          member_id: 'member-123',
          content: 'New message',
        })
      ).rejects.toThrow('Send failed');
    });
  });

  describe('useDeleteMessage - Delete Message', () => {
    it('should delete message successfully', async () => {
      const mockFrom = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useDeleteMessage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          messageId: 'msg-1',
          householdId: 'household-123',
        });
      });

      expect(mockFrom.delete).toHaveBeenCalled();
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'msg-1');
    });

    it('should handle delete error', async () => {
      const mockFrom = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useDeleteMessage(), { wrapper });

      await expect(
        result.current.mutateAsync({
          messageId: 'msg-1',
          householdId: 'household-123',
        })
      ).rejects.toThrow('Delete failed');
    });
  });
});
