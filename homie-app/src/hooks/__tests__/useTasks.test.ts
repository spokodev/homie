import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useCompleteTask } from '../useTasks';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock error handling
jest.mock('@/utils/errorHandling', () => ({
  logError: jest.fn(),
}));

// Mock gamification
jest.mock('@/utils/gamification', () => ({
  calculatePoints: jest.fn((minutes) => Math.ceil((minutes || 0) / 5)),
  calculateLevel: jest.fn((points) => Math.floor((points || 0) / 100) + 1),
}));

describe('useTasks Integration Tests', () => {
  let queryClient: QueryClient;

  const mockTask = {
    id: 'task-123',
    title: 'Clean kitchen',
    description: 'Wipe counters and mop floor',
    room: 'Kitchen',
    estimated_minutes: 30,
    points: 6,
    status: 'pending',
    household_id: 'household-123',
    assignee_id: 'member-123',
    created_by: 'member-123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

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

  describe('useTasks - Fetch Tasks', () => {
    it('should fetch tasks successfully', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockTask],
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useTasks('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockTask]);
      expect(supabase.from).toHaveBeenCalledWith('tasks');
    });

    it('should return empty array when household ID is not provided', () => {
      const { result } = renderHook(() => useTasks(undefined), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Database error');
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(mockError),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useTasks('household-123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useCreateTask - Create Task', () => {
    it('should create task successfully', async () => {
      const newTaskData = {
        title: 'New Task',
        description: 'Task description',
        room: 'Bedroom',
        estimated_minutes: 20,
        household_id: 'household-123',
        created_by_member_id: 'member-123',
      };

      const createdTask = {
        ...mockTask,
        ...newTaskData,
        id: 'task-new',
        points: 4,
      };

      const mockFrom = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: createdTask,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCreateTask(), { wrapper });

      let createdResult;
      await act(async () => {
        createdResult = await result.current.mutateAsync(newTaskData);
      });

      expect(createdResult).toEqual(createdTask);
      expect(mockFrom.insert).toHaveBeenCalledWith({
        title: newTaskData.title,
        description: newTaskData.description,
        room: newTaskData.room,
        estimated_minutes: newTaskData.estimated_minutes,
        points: 4, // calculated from estimated_minutes
        household_id: newTaskData.household_id,
        assignee_id: undefined,
        created_by: newTaskData.created_by_member_id,
        status: 'pending',
      });
    });

    it('should handle create error', async () => {
      const mockError = new Error('Insert failed');
      const mockFrom = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useCreateTask(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({
            title: 'New Task',
            household_id: 'household-123',
            created_by_member_id: 'member-123',
          });
        })
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('useUpdateTask - Update Task', () => {
    it('should update task successfully', async () => {
      const updates = {
        title: 'Updated Task Title',
        description: 'Updated description',
      };

      const updatedTask = {
        ...mockTask,
        ...updates,
      };

      const mockFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updatedTask,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useUpdateTask(), { wrapper });

      let updateResult;
      await act(async () => {
        updateResult = await result.current.mutateAsync({
          id: 'task-123',
          updates,
        });
      });

      expect(updateResult).toEqual(updatedTask);
      expect(mockFrom.update).toHaveBeenCalledWith(updates);
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'task-123');
    });
  });

  describe('useDeleteTask - Delete Task', () => {
    it('should delete task successfully', async () => {
      const mockFrom = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useDeleteTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('task-123');
      });

      expect(mockFrom.delete).toHaveBeenCalled();
      expect(mockFrom.eq).toHaveBeenCalledWith('id', 'task-123');
    });

    it('should handle delete error', async () => {
      const mockError = new Error('Delete failed');
      const mockFrom = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: mockError,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { result } = renderHook(() => useDeleteTask(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync('task-123');
        })
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('useCompleteTask - Complete Task', () => {
    it('should complete task successfully and award points', async () => {
      const completedTask = {
        ...mockTask,
        status: 'completed',
        completed_at: expect.any(String),
      };

      const member = {
        id: 'member-123',
        points: 100,
        level: 2,
        streak_days: 5,
        last_completed_at: '2025-01-01T00:00:00Z',
      };

      const updatedMember = {
        ...member,
        points: 106, // +6 points
        level: 2,
        streak_days: 6,
        last_completed_at: expect.any(String),
      };

      // Mock task update
      const mockTaskFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: completedTask,
          error: null,
        }),
      };

      // Mock member fetch
      const mockMemberSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: member,
          error: null,
        }),
      };

      // Mock member update
      const mockMemberUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: updatedMember,
          error: null,
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockTaskFrom) // First call for task update
        .mockReturnValueOnce(mockMemberSelect) // Second call for member fetch
        .mockReturnValueOnce(mockMemberUpdate); // Third call for member update

      const { result } = renderHook(() => useCompleteTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          taskId: 'task-123',
          actualMinutes: 30,
        });
      });

      expect(mockTaskFrom.update).toHaveBeenCalledWith({
        status: 'completed',
        completed_at: expect.any(String),
      });

      expect(mockMemberUpdate.update).toHaveBeenCalledWith({
        points: 106,
        level: 2,
        streak_days: 6,
        last_completed_at: expect.any(String),
      });
    });
  });
});
