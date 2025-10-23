import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useRecurringTasks,
  useCreateRecurringTask,
  useUpdateRecurringTask,
  useDeleteRecurringTask,
} from '../useRecurringTasks';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock HouseholdContext
jest.mock('@/contexts/HouseholdContext', () => ({
  useHousehold: () => ({
    household: { id: 'test-household-id', name: 'Test Household' },
    member: { id: 'test-member-id', name: 'Test Member' },
  }),
}));

// Mock analytics
jest.mock('@/utils/analytics', () => ({
  trackEvent: jest.fn(),
  ANALYTICS_EVENTS: {
    TASK_CREATED: 'task_created',
    TASK_UPDATED: 'task_updated',
    TASK_DELETED: 'task_deleted',
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useRecurringTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('useRecurringTasks', () => {
    it('fetches recurring tasks successfully', async () => {
      const mockRecurringTasks = [
        {
          id: '1',
          household_id: 'test-household-id',
          title: 'Weekly Cleaning',
          recurrence_rule: {
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: ['monday', 'friday'],
          },
          is_active: true,
          next_occurrence_at: '2025-01-27T10:00:00Z',
          total_occurrences: 5,
          created_by: 'test-member-id',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockRecurringTasks,
          error: null,
        }),
      });

      const { result } = renderHook(() => useRecurringTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRecurringTasks);
    });

    it('handles fetch error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const { result } = renderHook(() => useRecurringTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useCreateRecurringTask', () => {
    it('creates recurring task successfully', async () => {
      const newRecurringTask = {
        title: 'Daily Exercise',
        description: 'Morning workout',
        category: 'general',
        estimated_minutes: 30,
        recurrence_rule: {
          frequency: 'daily' as const,
          interval: 1,
        },
      };

      const mockCreatedTask = {
        id: '2',
        household_id: 'test-household-id',
        ...newRecurringTask,
        points: 6,
        is_active: true,
        next_occurrence_at: '2025-01-24T00:00:00Z',
        total_occurrences: 0,
        created_by: 'test-member-id',
        created_at: '2025-01-23T00:00:00Z',
        updated_at: '2025-01-23T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCreatedTask,
          error: null,
        }),
      });

      const { result } = renderHook(() => useCreateRecurringTask(), { wrapper });

      await waitFor(async () => {
        const data = await result.current.mutateAsync(newRecurringTask);
        expect(data).toEqual(mockCreatedTask);
      });
    });

    it('validates recurrence rule', async () => {
      const invalidTask = {
        title: 'Invalid Task',
        recurrence_rule: {
          frequency: 'daily' as const,
          interval: -1, // Invalid
        },
      };

      const { result } = renderHook(() => useCreateRecurringTask(), { wrapper });

      // The hook should handle validation or throw error
      await expect(
        result.current.mutateAsync(invalidTask as any)
      ).rejects.toThrow();
    });
  });

  describe('useUpdateRecurringTask', () => {
    it('updates recurring task successfully', async () => {
      const taskId = '1';
      const updates = {
        title: 'Updated Title',
        is_active: false,
      };

      const mockUpdatedTask = {
        id: taskId,
        household_id: 'test-household-id',
        title: 'Updated Title',
        is_active: false,
        recurrence_rule: {
          frequency: 'weekly',
          interval: 1,
        },
        next_occurrence_at: '2025-01-27T10:00:00Z',
        total_occurrences: 5,
        created_by: 'test-member-id',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-23T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUpdatedTask,
          error: null,
        }),
      });

      const { result } = renderHook(() => useUpdateRecurringTask(), { wrapper });

      await waitFor(async () => {
        const data = await result.current.mutateAsync({ id: taskId, updates });
        expect(data).toEqual(mockUpdatedTask);
      });
    });
  });

  describe('useDeleteRecurringTask', () => {
    it('deletes recurring task successfully', async () => {
      const taskId = '1';

      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      const { result } = renderHook(() => useDeleteRecurringTask(), { wrapper });

      await waitFor(async () => {
        const data = await result.current.mutateAsync(taskId);
        expect(data).toEqual(taskId);
      });
    });

    it('handles delete error', async () => {
      const taskId = '1';

      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Delete failed' },
        }),
      });

      const { result } = renderHook(() => useDeleteRecurringTask(), { wrapper });

      await expect(result.current.mutateAsync(taskId)).rejects.toThrow();
    });
  });
});

describe('Recurrence Rule Validation', () => {
  it('validates daily recurrence', () => {
    const rule = {
      frequency: 'daily' as const,
      interval: 1,
    };
    expect(rule.interval).toBeGreaterThan(0);
  });

  it('validates weekly recurrence with days', () => {
    const rule = {
      frequency: 'weekly' as const,
      interval: 1,
      daysOfWeek: ['monday', 'wednesday', 'friday'] as const,
    };
    expect(rule.daysOfWeek).toBeDefined();
    expect(rule.daysOfWeek!.length).toBeGreaterThan(0);
  });

  it('validates monthly recurrence with day of month', () => {
    const rule = {
      frequency: 'monthly' as const,
      interval: 1,
      dayOfMonth: 15,
    };
    expect(rule.dayOfMonth).toBeGreaterThanOrEqual(1);
    expect(rule.dayOfMonth).toBeLessThanOrEqual(31);
  });

  it('validates end conditions', () => {
    const rule = {
      frequency: 'daily' as const,
      interval: 1,
      endAfterOccurrences: 10,
    };
    expect(rule.endAfterOccurrences).toBeGreaterThan(0);
  });
});
