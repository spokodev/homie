import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTaskCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useTaskCategories';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Mock household context
jest.mock('@/contexts/HouseholdContext', () => ({
  useHousehold: () => ({
    household: { id: 'test-household-id' },
    member: { id: 'test-member-id', role: 'admin' },
  }),
}));

describe('useTaskCategories', () => {
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

  describe('Fetching categories', () => {
    it('should fetch all categories for household', async () => {
      // Arrange
      const mockCategories = [
        { id: '1', name: 'Cleaning', icon: '🧹', color: '#10B981', is_custom: false },
        { id: '2', name: 'Custom', icon: '⭐', color: '#FF0000', is_custom: true },
      ];

      const selectMock = jest.fn().mockResolvedValue({ data: mockCategories, error: null });
      const eqMock = jest.fn().mockReturnValue({ select: selectMock });
      const fromMock = jest.fn().mockReturnValue({ eq: eqMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useTaskCategories(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.data).toEqual(mockCategories);
      });
      expect(fromMock).toHaveBeenCalledWith('task_categories');
      expect(eqMock).toHaveBeenCalledWith('household_id', 'test-household-id');
    });

    it('should merge predefined and custom categories', async () => {
      // Arrange
      const mockCategories = [
        { id: '1', name: 'Cleaning', icon: '🧹', color: '#10B981', is_custom: false },
        { id: '2', name: 'Kitchen', icon: '🍳', color: '#F59E0B', is_custom: false },
        { id: '3', name: 'My Custom', icon: '⭐', color: '#FF0000', is_custom: true },
      ];

      const selectMock = jest.fn().mockResolvedValue({ data: mockCategories, error: null });
      const orderMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const fromMock = jest.fn().mockReturnValue({ eq: eqMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useTaskCategories(), { wrapper });

      // Assert
      await waitFor(() => {
        expect(result.current.data).toHaveLength(3);
        expect(result.current.data?.filter(c => !c.is_custom)).toHaveLength(2);
        expect(result.current.data?.filter(c => c.is_custom)).toHaveLength(1);
      });
    });
  });

  describe('Creating categories', () => {
    it('should create category only if user is admin', async () => {
      // Arrange
      const newCategory = {
        name: 'New Category',
        icon: '🎯',
        color: '#123456',
      };

      const singleMock = jest.fn().mockResolvedValue({
        data: { id: 'new-id', ...newCategory, is_custom: true },
        error: null,
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      const fromMock = jest.fn().mockReturnValue({ insert: insertMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useCreateCategory(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(newCategory);
      });

      // Assert
      expect(insertMock).toHaveBeenCalledWith({
        household_id: 'test-household-id',
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color,
        created_by: 'test-member-id',
        is_custom: true,
      });
    });

    it('should handle duplicate names with error', async () => {
      // Arrange
      const duplicateCategory = {
        name: 'Cleaning', // Already exists
        icon: '🎯',
        color: '#123456',
      };

      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      const fromMock = jest.fn().mockReturnValue({ insert: insertMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useCreateCategory(), { wrapper });

      // Assert
      await expect(
        act(async () => {
          await result.current.mutateAsync(duplicateCategory);
        })
      ).rejects.toThrow();
    });

    it('should reject creation if user is not admin', async () => {
      // Arrange - Override mock to make user non-admin
      jest.resetModules();
      jest.doMock('@/contexts/HouseholdContext', () => ({
        useHousehold: () => ({
          household: { id: 'test-household-id' },
          member: { id: 'test-member-id', role: 'member' }, // Not admin
        }),
      }));

      const { useCreateCategory: useCreateCategoryNonAdmin } = require('@/hooks/useTaskCategories');

      // Act
      const { result } = renderHook(() => useCreateCategoryNonAdmin(), { wrapper });

      // Assert
      await expect(
        act(async () => {
          await result.current.mutateAsync({
            name: 'Test',
            icon: '🎯',
            color: '#123456',
          });
        })
      ).rejects.toThrow('Only admins can create categories');
    });
  });

  describe('Deleting categories', () => {
    it('should delete custom category only if user is admin', async () => {
      // Arrange
      const categoryToDelete = {
        id: 'custom-id',
        name: 'Custom Category',
        is_custom: true,
      };

      const eqMock2 = jest.fn().mockResolvedValue({ error: null });
      const eqMock1 = jest.fn().mockReturnValue({ eq: eqMock2 });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqMock1 });
      const fromMock = jest.fn().mockReturnValue({ delete: deleteMock });

      (supabase.from as jest.Mock).mockImplementation(fromMock);

      // Act
      const { result } = renderHook(() => useDeleteCategory(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(categoryToDelete);
      });

      // Assert
      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock1).toHaveBeenCalledWith('id', categoryToDelete.id);
    });

    it('should not allow deleting predefined categories', async () => {
      // Arrange
      const predefinedCategory = {
        id: 'predefined-id',
        name: 'Cleaning',
        is_custom: false,
      };

      // Act
      const { result } = renderHook(() => useDeleteCategory(), { wrapper });

      // Assert
      await expect(
        act(async () => {
          await result.current.mutateAsync(predefinedCategory);
        })
      ).rejects.toThrow('Cannot delete predefined categories');
    });

    it('should reject deletion if user is not admin', async () => {
      // Arrange - Override mock to make user non-admin
      jest.resetModules();
      jest.doMock('@/contexts/HouseholdContext', () => ({
        useHousehold: () => ({
          household: { id: 'test-household-id' },
          member: { id: 'test-member-id', role: 'member' }, // Not admin
        }),
      }));

      const { useDeleteCategory: useDeleteCategoryNonAdmin } = require('@/hooks/useTaskCategories');

      // Act
      const { result } = renderHook(() => useDeleteCategoryNonAdmin(), { wrapper });

      // Assert
      await expect(
        act(async () => {
          await result.current.mutateAsync({
            id: 'custom-id',
            name: 'Custom',
            is_custom: true,
          });
        })
      ).rejects.toThrow('Only admins can delete categories');
    });
  });

  describe('Category validation', () => {
    it('should validate category name length (max 50 chars)', async () => {
      // Arrange
      const longNameCategory = {
        name: 'A'.repeat(51), // 51 chars - too long
        icon: '🎯',
        color: '#123456',
      };

      // Act
      const { result } = renderHook(() => useCreateCategory(), { wrapper });

      // Assert
      await expect(
        act(async () => {
          await result.current.mutateAsync(longNameCategory);
        })
      ).rejects.toThrow('Category name must be 50 characters or less');
    });

    it('should validate icon is emoji', async () => {
      // Arrange
      const invalidIconCategory = {
        name: 'Test Category',
        icon: 'ABC', // Not an emoji
        color: '#123456',
      };

      // Act
      const { result } = renderHook(() => useCreateCategory(), { wrapper });

      // Assert
      await expect(
        act(async () => {
          await result.current.mutateAsync(invalidIconCategory);
        })
      ).rejects.toThrow('Icon must be a single emoji');
    });

    it('should validate color is hex format', async () => {
      // Arrange
      const invalidColorCategory = {
        name: 'Test Category',
        icon: '🎯',
        color: 'red', // Not hex format
      };

      // Act
      const { result } = renderHook(() => useCreateCategory(), { wrapper });

      // Assert
      await expect(
        act(async () => {
          await result.current.mutateAsync(invalidColorCategory);
        })
      ).rejects.toThrow('Color must be in hex format (#RRGGBB)');
    });
  });
});