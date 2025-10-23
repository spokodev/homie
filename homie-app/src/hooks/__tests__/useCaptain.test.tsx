import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCaptain, useRotateCaptain, useCaptainStats } from '../useCaptain';
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

// Mock Analytics
jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
  ANALYTICS_EVENTS: {
    CAPTAIN_ROTATED: 'captain_rotated',
  },
}));

describe('useCaptain Integration Tests', () => {
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

  describe('useCaptain - Fetch Current Captain', () => {
    it('should fetch current captain successfully', async () => {
      const mockHousehold = {
        captain_member_id: 'captain-123',
        captain_started_at: '2024-01-01T00:00:00Z',
        captain_ends_at: '2024-01-08T00:00:00Z',
        captain_total_ratings: 3,
        captain_average_rating: '4.5',
        captain: {
          id: 'captain-123',
          name: 'John',
          avatar: '👨',
          times_captain: 2,
        },
      };

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockHousehold, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCaptain('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toMatchObject({
        id: 'captain-123',
        name: 'John',
        avatar: '👨',
        total_ratings: 3,
        average_rating: 4.5,
        times_captain: 2,
      });
    });

    it('should return null if no captain assigned', async () => {
      const mockHousehold = {
        captain_member_id: null,
        captain_started_at: null,
        captain_ends_at: null,
        captain: null,
      };

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockHousehold, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCaptain('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('should calculate days left correctly', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockHousehold = {
        captain_member_id: 'captain-123',
        captain_started_at: new Date().toISOString(),
        captain_ends_at: tomorrow.toISOString(),
        captain_total_ratings: 0,
        captain_average_rating: null,
        captain: {
          id: 'captain-123',
          name: 'John',
          avatar: '👨',
          times_captain: 1,
        },
      };

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockHousehold, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCaptain('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.days_left).toBeGreaterThanOrEqual(0);
    });

    it('should handle fetch error', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCaptain('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useRotateCaptain - Rotate Captain', () => {
    it('should rotate captain automatically', async () => {
      // Mock fetching members
      const mockMembersFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            { id: 'member-1', times_captain: 0 },
            { id: 'member-2', times_captain: 1 },
          ],
          error: null,
        }),
      };

      // Mock updating household
      const mockHouseholdFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      // Mock RPC call
      const mockRpc = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockMembersFrom) // First call for fetching members
        .mockReturnValueOnce(mockHouseholdFrom); // Second call for updating household

      (supabase as any).rpc = mockRpc;

      const { result } = renderHook(() => useRotateCaptain(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ household_id: 'household-123' });
      });

      expect(mockHouseholdFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          captain_member_id: 'member-1',
          captain_total_ratings: 0,
          captain_average_rating: null,
        })
      );
    });

    it('should rotate to specified captain', async () => {
      const mockHouseholdFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      const mockRpc = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockReturnValue(mockHouseholdFrom);
      (supabase as any).rpc = mockRpc;

      const { result } = renderHook(() => useRotateCaptain(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          household_id: 'household-123',
          next_captain_id: 'member-specific',
        });
      });

      expect(mockHouseholdFrom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          captain_member_id: 'member-specific',
        })
      );
    });

    it('should handle rotation error', async () => {
      const mockMembersFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockMembersFrom);

      const { result } = renderHook(() => useRotateCaptain(), { wrapper });

      await expect(
        result.current.mutateAsync({ household_id: 'household-123' })
      ).rejects.toThrow('No members available to be captain');
    });
  });

  describe('useCaptainStats - Captain Statistics', () => {
    it('should fetch captain stats successfully', async () => {
      const mockMember = {
        times_captain: 5,
        captain_average_rating: '4.2',
      };

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMember, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCaptainStats('member-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        times_captain: 5,
        average_rating: 4.2,
      });
    });

    it('should handle null stats', async () => {
      const mockMember = {
        times_captain: null,
        captain_average_rating: null,
      };

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMember, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCaptainStats('member-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        times_captain: 0,
        average_rating: null,
      });
    });
  });
});
