import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMemberBadges, useAwardBadge, useGroupedBadges, useBadgeStats } from '../useBadges';
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

// Mock Premium Store
jest.mock('@/stores/premium.store', () => ({
  usePremiumStore: () => ({ isPremium: false }),
}));

describe('useBadges Integration Tests', () => {
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

  describe('useMemberBadges - Fetch Badges', () => {
    it('should fetch member badges successfully', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          member_id: 'member-123',
          badge_id: 'first_task',
          earned_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'badge-2',
          member_id: 'member-123',
          badge_id: 'week_streak',
          earned_at: '2024-01-02T10:00:00Z',
        },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockBadges, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useMemberBadges('member-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].badge_id).toBe('first_task');
      expect(result.current.data?.[1].badge_id).toBe('week_streak');
    });

    it('should handle empty badges', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useMemberBadges('member-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle fetch error', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useMemberBadges('member-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAwardBadge - Award Badge', () => {
    it('should award badge successfully', async () => {
      // Mock check for existing badge
      const mockCheckFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      // Mock insert badge
      const mockInsertFrom = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'badge-new',
            member_id: 'member-123',
            badge_id: 'home_hero',
            earned_at: '2024-01-03T10:00:00Z',
          },
          error: null,
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockCheckFrom) // First call for checking
        .mockReturnValueOnce(mockInsertFrom); // Second call for inserting

      const { result } = renderHook(() => useAwardBadge(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          memberId: 'member-123',
          badgeId: 'home_hero',
        });
      });

      expect(mockInsertFrom.insert).toHaveBeenCalledWith({
        member_id: 'member-123',
        badge_id: 'home_hero',
      });
    });

    it('should not award badge if already earned', async () => {
      // Mock check for existing badge - badge already exists
      const mockCheckFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'badge-existing',
            member_id: 'member-123',
            badge_id: 'home_hero',
          },
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockCheckFrom);

      const { result } = renderHook(() => useAwardBadge(), { wrapper });

      const response = await result.current.mutateAsync({
        memberId: 'member-123',
        badgeId: 'home_hero',
      });

      expect(response).toBeNull();
    });

    it('should handle award error', async () => {
      const mockCheckFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      const mockInsertFrom = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Award failed')),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockCheckFrom)
        .mockReturnValueOnce(mockInsertFrom);

      const { result } = renderHook(() => useAwardBadge(), { wrapper });

      await expect(
        result.current.mutateAsync({
          memberId: 'member-123',
          badgeId: 'home_hero',
        })
      ).rejects.toThrow('Award failed');
    });
  });

  describe('useGroupedBadges - Grouped Badges', () => {
    it('should group badges into earned and locked', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          member_id: 'member-123',
          badge_id: 'first_task',
          earned_at: '2024-01-01T10:00:00Z',
        },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockBadges, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useGroupedBadges('member-123', false), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.earned).toHaveLength(1);
      expect(result.current.data?.locked).toHaveLength(4); // 5 free badges total - 1 earned
    });
  });

  describe('useBadgeStats - Badge Statistics', () => {
    it('should calculate badge stats correctly', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          member_id: 'member-123',
          badge_id: 'first_task',
          earned_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'badge-2',
          member_id: 'member-123',
          badge_id: 'week_streak',
          earned_at: '2024-01-02T10:00:00Z',
        },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockBadges, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useBadgeStats('member-123', false), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.earnedCount).toBe(2);
      expect(result.current.data?.totalCount).toBe(5); // Free user
    });
  });
});
