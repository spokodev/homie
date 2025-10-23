import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useCaptainRotationRatings,
  useHasRatedCaptain,
  useRateCaptain,
  useCaptainRatingHistory,
} from '../useRatings';
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

// Mock constants
jest.mock('@/constants', () => ({
  APP_CONFIG: {
    game: {
      captainRatingMultiplier: 20,
    },
  },
}));

describe('useRatings Integration Tests', () => {
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

  describe('useCaptainRotationRatings - Fetch Rotation Ratings', () => {
    it('should fetch ratings for a rotation', async () => {
      const mockRatings = [
        {
          id: 'rating-1',
          captain_member_id: 'captain-123',
          rated_by_member_id: 'member-456',
          rating: 5,
          comment: 'Great job!',
          rotation_start: '2024-01-01T00:00:00Z',
          rotation_end: '2024-01-08T00:00:00Z',
          created_at: '2024-01-07T10:00:00Z',
          captain: { name: 'John', avatar: '👨' },
          rater: { name: 'Jane', avatar: '👩' },
        },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockRatings, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(
        () => useCaptainRotationRatings('captain-123', '2024-01-01T00:00:00Z'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0]).toMatchObject({
        rating: 5,
        comment: 'Great job!',
        captain_name: 'John',
        rated_by_name: 'Jane',
      });
    });

    it('should handle empty ratings', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(
        () => useCaptainRotationRatings('captain-123', '2024-01-01T00:00:00Z'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useCaptainRatingHistory - Fetch Rating History', () => {
    it('should fetch captain rating history', async () => {
      const mockRatings = [
        {
          id: 'rating-1',
          rating: 5,
          rotation_start: '2024-01-01T00:00:00Z',
          captain: { name: 'John', avatar: '👨' },
          rater: { name: 'Jane', avatar: '👩' },
        },
        {
          id: 'rating-2',
          rating: 4,
          rotation_start: '2023-12-25T00:00:00Z',
          captain: { name: 'John', avatar: '👨' },
          rater: { name: 'Bob', avatar: '🧔' },
        },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockRatings, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCaptainRatingHistory('captain-123'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('useHasRatedCaptain - Check if Already Rated', () => {
    it('should return true if already rated', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'rating-1' }, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(
        () =>
          useHasRatedCaptain(
            'household-123',
            'captain-123',
            'member-456',
            '2024-01-01T00:00:00Z'
          ),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(true);
    });

    it('should return false if not rated yet', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(
        () =>
          useHasRatedCaptain(
            'household-123',
            'captain-123',
            'member-456',
            '2024-01-01T00:00:00Z'
          ),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(false);
    });
  });

  describe('useRateCaptain - Submit Rating', () => {
    it('should submit rating successfully', async () => {
      // Mock check for existing rating
      const mockCheckFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      // Mock insert rating
      const mockInsertFrom = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'rating-new',
            rating: 5,
          },
          error: null,
        }),
      };

      // Mock fetch all ratings for this rotation
      const mockAllRatingsFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ rating: 5 }, { rating: 4 }],
          error: null,
        }),
      };

      // Mock update household
      const mockUpdateHouseholdFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      // Mock fetch captain points
      const mockCaptainFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { points: 100 },
          error: null,
        }),
      };

      // Mock update captain points
      const mockUpdateCaptainFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      // Mock fetch all captain ratings
      const mockAllCaptainRatingsFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ rating: 5 }, { rating: 4 }, { rating: 5 }],
          error: null,
        }),
      };

      // Mock update captain lifetime rating
      const mockUpdateCaptainRatingFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockCheckFrom) // Check existing
        .mockReturnValueOnce(mockInsertFrom) // Insert rating
        .mockReturnValueOnce(mockAllRatingsFrom) // Fetch all ratings for rotation
        .mockReturnValueOnce(mockUpdateHouseholdFrom) // Update household
        .mockReturnValueOnce(mockCaptainFrom) // Fetch captain points
        .mockReturnValueOnce(mockUpdateCaptainFrom) // Update captain points
        .mockReturnValueOnce(mockAllCaptainRatingsFrom) // Fetch all captain ratings
        .mockReturnValueOnce(mockUpdateCaptainRatingFrom); // Update captain rating

      const { result } = renderHook(() => useRateCaptain(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          household_id: 'household-123',
          captain_member_id: 'captain-123',
          rated_by_member_id: 'member-456',
          rating: 5,
          comment: 'Excellent!',
          rotation_start: '2024-01-01T00:00:00Z',
          rotation_end: '2024-01-08T00:00:00Z',
        });
      });

      expect(mockInsertFrom.insert).toHaveBeenCalledWith({
        household_id: 'household-123',
        captain_member_id: 'captain-123',
        rated_by_member_id: 'member-456',
        rating: 5,
        comment: 'Excellent!',
        rotation_start: '2024-01-01T00:00:00Z',
        rotation_end: '2024-01-08T00:00:00Z',
      });
    });

    it('should reject invalid rating', async () => {
      const { result } = renderHook(() => useRateCaptain(), { wrapper });

      await expect(
        result.current.mutateAsync({
          household_id: 'household-123',
          captain_member_id: 'captain-123',
          rated_by_member_id: 'member-456',
          rating: 6, // Invalid
          rotation_start: '2024-01-01T00:00:00Z',
          rotation_end: '2024-01-08T00:00:00Z',
        })
      ).rejects.toThrow('Rating must be between 1 and 5 stars');
    });

    it('should reject duplicate rating', async () => {
      const mockCheckFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockCheckFrom);

      const { result } = renderHook(() => useRateCaptain(), { wrapper });

      await expect(
        result.current.mutateAsync({
          household_id: 'household-123',
          captain_member_id: 'captain-123',
          rated_by_member_id: 'member-456',
          rating: 5,
          rotation_start: '2024-01-01T00:00:00Z',
          rotation_end: '2024-01-08T00:00:00Z',
        })
      ).rejects.toThrow('You have already rated this captain for this rotation');
    });
  });
});
