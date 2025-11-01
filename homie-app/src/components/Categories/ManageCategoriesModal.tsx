import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import {
  useTaskCategories,
  useCreateCategory,
  useDeleteCategory,
} from '@/hooks/useTaskCategories';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useToast } from '@/components/Toast';

const EMOJI_OPTIONS = [
  '🧹', '🍳', '🚿', '🐕', '🧺', '🌱', '🔧', '🛒', '📋',
  '🎯', '⭐', '🏠', '🚗', '💻', '📚', '🎨', '🎮', '⚽',
  '🍔', '🎵', '🛏️', '🪴', '🧼', '🗑️', '💡', '📦', '🔑',
];

const COLOR_OPTIONS = [
  '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899',
  '#14B8A6', '#6B7280', '#EF4444', '#6366F1', '#84CC16',
  '#22D3EE', '#A855F7', '#F97316', '#06B6D4', '#0EA5E9',
];

interface ManageCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  onCategorySelected?: (categoryId: string) => void;
}

export function ManageCategoriesModal({
  visible,
  onClose,
  onCategorySelected,
}: ManageCategoriesModalProps) {
  const { colors } = useTheme();
  const { member } = useHousehold();
  const { data: categories = [], isLoading } = useTaskCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const { showToast } = useToast();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📋');
  const [selectedColor, setSelectedColor] = useState('#6366F1');

  const isAdmin = member?.role === 'admin';

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast('Enter category name', 'error');
      return;
    }

    if (newCategoryName.length > 50) {
      showToast('Name must be no more than 50 characters', 'error');
      return;
    }

    try {
      await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        icon: selectedEmoji,
        color: selectedColor,
      });

      showToast('Category created successfully', 'success');
      setShowCreateForm(false);
      setNewCategoryName('');
      setSelectedEmoji('📋');
      setSelectedColor('#6366F1');
    } catch (error: any) {
      showToast(error.message || 'Failed to create category', 'error');
    }
  };

  const handleDeleteCategory = (category: { id: string; name: string; is_custom: boolean }) => {
    if (!category.is_custom) {
      showToast('Cannot delete predefined categories', 'error');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the category "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory.mutateAsync(category);
              showToast('Category deleted', 'success');
            } catch (error: any) {
              showToast(error.message || 'Failed to delete category', 'error');
            }
          },
        },
      ]
    );
  };

  const renderCategory = (category: any) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryItem}
      onPress={() => {
        if (onCategorySelected) {
          onCategorySelected(category.id);
          onClose();
        }
      }}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
        <Text style={styles.categoryEmoji}>{category.icon}</Text>
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{category.name}</Text>
        {category.is_custom && (
          <Text style={styles.categoryType}>Custom category</Text>
        )}
      </View>
      {isAdmin && category.is_custom && (
        <TouchableOpacity
          onPress={() => handleDeleteCategory(category)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Task Categories</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Categories List */}
          <ScrollView style={styles.scrollView}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <>
                {/* Predefined Categories */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Predefined Categories</Text>
                  {categories
                    .filter(c => !c.is_custom)
                    .map(renderCategory)}
                </View>

                {/* Custom Categories */}
                {categories.some(c => c.is_custom) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Custom Categories</Text>
                    {categories
                      .filter(c => c.is_custom)
                      .map(renderCategory)}
                  </View>
                )}

                {/* Add Category Button (Admin only) */}
                {isAdmin && !showCreateForm && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowCreateForm(true)}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                    <Text style={styles.addButtonText}>Add Custom Category</Text>
                  </TouchableOpacity>
                )}

                {/* Create Category Form */}
                {isAdmin && showCreateForm && (
                  <View style={styles.createForm}>
                    <Text style={styles.formTitle}>New Category</Text>

                    {/* Name Input */}
                    <TextInput
                      style={styles.nameInput}
                      placeholder="Category Name"
                      placeholderTextColor={Colors.textSecondary}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      maxLength={50}
                    />
                    <Text style={styles.charCount}>
                      {newCategoryName.length}/50
                    </Text>

                    {/* Emoji Selector */}
                    <Text style={styles.formLabel}>Select Icon:</Text>
                    <View style={styles.emojiGrid}>
                      {EMOJI_OPTIONS.map(emoji => (
                        <TouchableOpacity
                          key={emoji}
                          style={[
                            styles.emojiOption,
                            selectedEmoji === emoji && styles.selectedEmoji,
                          ]}
                          onPress={() => setSelectedEmoji(emoji)}
                        >
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Color Selector */}
                    <Text style={styles.formLabel}>Select Color:</Text>
                    <View style={styles.colorGrid}>
                      {COLOR_OPTIONS.map(color => (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            selectedColor === color && styles.selectedColor,
                          ]}
                          onPress={() => setSelectedColor(color)}
                        />
                      ))}
                    </View>

                    {/* Preview */}
                    <View style={styles.preview}>
                      <Text style={styles.previewLabel}>Preview:</Text>
                      <View style={styles.previewCategory}>
                        <View
                          style={[
                            styles.categoryIcon,
                            { backgroundColor: selectedColor + '20' },
                          ]}
                        >
                          <Text style={styles.categoryEmoji}>{selectedEmoji}</Text>
                        </View>
                        <Text style={styles.categoryName}>
                          {newCategoryName || 'Category Name'}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.formActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowCreateForm(false);
                          setNewCategoryName('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.createButton,
                          createCategory.isPending && styles.disabledButton,
                        ]}
                        onPress={handleCreateCategory}
                        disabled={createCategory.isPending || !newCategoryName.trim()}
                      >
                        {createCategory.isPending ? (
                          <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                          <Text style={styles.createButtonText}>Create</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray300,
  },
  title: {
    ...Typography.h4,
    color: Colors.text.default,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    maxHeight: 600,
  },
  loadingContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  categoryName: {
    ...Typography.bodyLarge,
    color: Colors.text.default,
    fontWeight: '500',
  },
  categoryType: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    ...Typography.bodyLarge,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  createForm: {
    padding: Spacing.lg,
    backgroundColor: Colors.gray100,
    margin: Spacing.lg,
    borderRadius: BorderRadius.medium,
  },
  formTitle: {
    ...Typography.h5,
    color: Colors.text.default,
    marginBottom: Spacing.md,
  },
  formLabel: {
    ...Typography.labelMedium,
    color: Colors.text.default,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  nameInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    ...Typography.bodyLarge,
    color: Colors.text.default,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  charCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emojiOption: {
    width: 48,
    height: 48,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gray300,
  },
  selectedEmoji: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  emojiText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: Colors.text,
  },
  preview: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
  },
  previewLabel: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  previewCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.gray300,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.text.default,
  },
  createButton: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  createButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
});