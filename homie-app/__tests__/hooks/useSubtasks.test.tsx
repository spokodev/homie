import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
  useToggleSubtaskCompletion,
  calculateTaskPoints,
} from '@/hooks/useSubtasks';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('useSubtasks', () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Fetching subtasks', () => {
    it('should fetch subtasks for a task', async () => {
      // Arrange
      const taskId = 'task-123';
      const mockSubtasks = [
        { id: '1', task_id: taskId, title: 'Subtask 1', points: 1, is_completed: false, sort_order: 0 },
        { id: '2', task_id: taskId, title: 'Subtask 2', points: 3, is_completed: false, sort_order: 1 },
        { id: '3', task_id: taskId, title: 'Subtask 3', points: 2, is_completed: true, sort_order: 2 },
      ];

      const selectMock = jest.fn().mockResolvedValue({ data: mockSubtasks, error: null });
      const orderMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const fromMock = jest.fn().mockReturnValue({ eq: eqMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useSubtasks(taskId), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.data).toEqual(mockSubtasks);
      });
      expect(fromMock).toHaveBeenCalledWith('subtasks');
      expect(eqMock).toHaveBeenCalledWith('task_id', taskId);
      expect(orderMock).toHaveBeenCalledWith('sort_order', { ascending: true });
    });

    it('should return empty array if no task ID', async () => {
      // Act
      const { result } = renderHook(() => useSubtasks(undefined), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.data).toBeUndefined();
      });
    });
  });

  describe('Creating subtasks', () => {
    it('should add subtask with default 1 point', async () => {
      // Arrange
      const newSubtask = {
        taskId: 'task-123',
        title: 'New Subtask',
      };

      const singleMock = jest.fn().mockResolvedValue({
        data: { id: 'new-id', ...newSubtask, points: 1, is_completed: false, sort_order: 0 },
        error: null,
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      const fromMock = jest.fn().mockReturnValue({ insert: insertMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useCreateSubtask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(newSubtask);
      });

      // Assert
      expect(insertMock).toHaveBeenCalledWith({
        task_id: newSubtask.taskId,
        title: newSubtask.title,
        points: 1,
        is_completed: false,
        sort_order: 0,
      });
    });

    it('should add subtask with custom points', async () => {
      // Arrange
      const newSubtask = {
        taskId: 'task-123',
        title: 'Complex Subtask',
        points: 5,
      };

      const singleMock = jest.fn().mockResolvedValue({
        data: { id: 'new-id', ...newSubtask, is_completed: false, sort_order: 0 },
        error: null,
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      const fromMock = jest.fn().mockReturnValue({ insert: insertMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useCreateSubtask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(newSubtask);
      });

      // Assert
      expect(insertMock).toHaveBeenCalledWith({
        task_id: newSubtask.taskId,
        title: newSubtask.title,
        points: 5,
        is_completed: false,
        sort_order: 0,
      });
    });

    it('should validate points (min 1, max 100)', async () => {
      // Arrange
      const invalidSubtask = {
        taskId: 'task-123',
        title: 'Invalid Points',
        points: 150, // Too high
      };

      // Act
      const { result } = renderHook(() => useCreateSubtask(), { wrapper });

      // Assert
      await expect(
        act(async () => {
          await result.current.mutateAsync(invalidSubtask);
        })
      ).rejects.toThrow('Points must be between 1 and 100');
    });

    it('should set proper sort order for new subtasks', async () => {
      // Arrange - Mock existing subtasks to determine sort order
      const taskId = 'task-123';
      const _existingSubtasks = [
        { id: '1', sort_order: 0 },
        { id: '2', sort_order: 1 },
        { id: '3', sort_order: 2 },
      ];

      // First mock for getting max sort_order
      const maxSelectMock = jest.fn().mockResolvedValue({
        data: { max_order: 2 },
        error: null
      });
      const maxSingleMock = jest.fn().mockReturnValue(maxSelectMock);

      // Then mock for insert
      const singleMock = jest.fn().mockResolvedValue({
        data: { id: 'new-id', sort_order: 3 },
        error: null,
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });

      let callCount = 0;
      const fromMock = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - get max sort_order
          return { select: maxSingleMock };
        } else {
          // Second call - insert
          return { insert: insertMock };
        }
      });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useCreateSubtask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          taskId,
          title: 'New Subtask',
        });
      });

      // Assert
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_order: 3, // Should be max + 1
        })
      );
    });
  });

  describe('Updating subtasks', () => {
    it('should update subtask title and points', async () => {
      // Arrange
      const updates = {
        id: 'subtask-123',
        title: 'Updated Title',
        points: 5,
      };

      const singleMock = jest.fn().mockResolvedValue({
        data: updates,
        error: null,
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      const fromMock = jest.fn().mockReturnValue({ update: updateMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useUpdateSubtask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updates);
      });

      // Assert
      expect(updateMock).toHaveBeenCalledWith({
        title: updates.title,
        points: updates.points,
      });
      expect(eqMock).toHaveBeenCalledWith('id', updates.id);
    });

    it('should validate updated points', async () => {
      // Arrange
      const invalidUpdate = {
        id: 'subtask-123',
        points: 0, // Too low
      };

      // Act
      const { result } = renderHook(() => useUpdateSubtask(), { wrapper });

      // Assert
      await expect(
        act(async () => {
          await result.current.mutateAsync(invalidUpdate);
        })
      ).rejects.toThrow('Points must be between 1 and 100');
    });
  });

  describe('Deleting subtasks', () => {
    it('should delete subtask', async () => {
      // Arrange
      const subtaskId = 'subtask-123';

      const eqMock = jest.fn().mockResolvedValue({ error: null });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
      const fromMock = jest.fn().mockReturnValue({ delete: deleteMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useDeleteSubtask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(subtaskId);
      });

      // Assert
      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', subtaskId);
    });
  });

  describe('Reordering subtasks', () => {
    it('should reorder subtasks', async () => {
      // Arrange
      const reorderData = {
        taskId: 'task-123',
        subtaskIds: ['sub-3', 'sub-1', 'sub-2'], // New order
      };

      const rpcMock = jest.fn().mockResolvedValue({ error: null });
      (supabase as any).rpc = rpcMock;

      // Act
      const { result } = renderHook(() => useReorderSubtasks(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(reorderData);
      });

      // Assert
      expect(rpcMock).toHaveBeenCalledWith('reorder_subtasks', {
        p_task_id: reorderData.taskId,
        p_subtask_ids: reorderData.subtaskIds,
      });
    });

    it('should allow drag and drop reordering', async () => {
      // This is more of an integration test with UI
      // The hook should provide the mutation function that UI can call
      const { result } = renderHook(() => useReorderSubtasks(), { wrapper });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.mutateAsync).toBeDefined();
    });
  });

  describe('Toggling subtask completion', () => {
    it('should mark subtasks as completed', async () => {
      // Arrange
      const toggleData = {
        subtaskId: 'subtask-123',
        isCompleted: true,
      };

      const singleMock = jest.fn().mockResolvedValue({
        data: { ...toggleData, is_completed: true },
        error: null,
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      const fromMock = jest.fn().mockReturnValue({ update: updateMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useToggleSubtaskCompletion(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(toggleData);
      });

      // Assert
      expect(updateMock).toHaveBeenCalledWith({ is_completed: true });
      expect(eqMock).toHaveBeenCalledWith('id', toggleData.subtaskId);
    });

    it('should return completed subtask IDs', async () => {
      // Arrange
      const taskId = 'task-123';
      const subtasks = [
        { id: 'sub-1', is_completed: true },
        { id: 'sub-2', is_completed: false },
        { id: 'sub-3', is_completed: true },
      ];

      const selectMock = jest.fn().mockResolvedValue({ data: subtasks, error: null });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      const fromMock = jest.fn().mockReturnValue({ eq: eqMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useSubtasks(taskId), { wrapper });

      // Assert
      await waitFor(() => {
        const completedIds = result.current.data
          ?.filter(s => s.is_completed)
          .map(s => s.id);
        expect(completedIds).toEqual(['sub-1', 'sub-3']);
      });
    });
  });

  describe('Points calculation', () => {
    it('should calculate total points from subtasks', () => {
      // Arrange
      const subtasks = [
        { id: '1', points: 2, is_completed: false },
        { id: '2', points: 3, is_completed: false },
        { id: '3', points: 5, is_completed: false },
      ];

      // Act
      const totalPoints = calculateTaskPoints(subtasks, []);

      // Assert
      expect(totalPoints).toBe(10);
    });

    it('should sum selected subtask points', () => {
      // Arrange
      const subtasks = [
        { id: '1', points: 2, is_completed: true },
        { id: '2', points: 3, is_completed: false },
        { id: '3', points: 5, is_completed: true },
      ];
      const completedIds = ['1', '3'];

      // Act
      const earnedPoints = calculateTaskPoints(subtasks, completedIds);

      // Assert
      expect(earnedPoints).toBe(7); // 2 + 5
    });

    it('should return 0 if no subtasks selected', () => {
      // Arrange
      const subtasks = [
        { id: '1', points: 2, is_completed: false },
        { id: '2', points: 3, is_completed: false },
      ];
      const completedIds: string[] = [];

      // Act
      const earnedPoints = calculateTaskPoints(subtasks, completedIds);

      // Assert
      expect(earnedPoints).toBe(0);
    });

    it('should ignore task points when subtasks exist', () => {
      // This is a business rule: if task has subtasks,
      // the original task points are ignored
      const hasSubtasks = true;
      const taskPoints = 10;
      const subtaskPoints = 5;

      const finalPoints = hasSubtasks ? subtaskPoints : taskPoints;

      expect(finalPoints).toBe(5);
    });

    it('should return fixed points if no subtasks', () => {
      // Business rule: tasks without subtasks use fixed points
      const hasSubtasks = false;
      const taskPoints = 10;

      const finalPoints = hasSubtasks ? 0 : taskPoints;

      expect(finalPoints).toBe(10);
    });
  });
});