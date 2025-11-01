import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { Subtask } from '@/hooks/useSubtasks';

interface SubtasksManagerProps {
  subtasks: Omit<Subtask, 'id' | 'task_id' | 'created_at'>[];
  onChange: (subtasks: Omit<Subtask, 'id' | 'task_id' | 'created_at'>[]) => void;
  disabled?: boolean;
}

export function SubtasksManager({ subtasks, onChange, disabled }: SubtasksManagerProps) {
  const [localSubtasks, setLocalSubtasks] = useState(subtasks);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskPoints, setNewSubtaskPoints] = useState('1');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPoints, setEditPoints] = useState('');

  useEffect(() => {
    setLocalSubtasks(subtasks);
  }, [subtasks]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      Alert.alert('Error', 'Enter subtask name');
      return;
    }

    const points = parseInt(newSubtaskPoints) || 1;
    if (points < 1 || points > 100) {
      Alert.alert('Error', 'Points must be between 1 and 100');
      return;
    }

    const newSubtask = {
      title: newSubtaskTitle.trim(),
      points,
      is_completed: false,
      sort_order: localSubtasks.length,
    };

    const updated = [...localSubtasks, newSubtask];
    setLocalSubtasks(updated);
    onChange(updated);

    // Reset form
    setNewSubtaskTitle('');
    setNewSubtaskPoints('1');
  };

  const handleDeleteSubtask = (index: number) => {
    Alert.alert(
      'Delete Subtask',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = localSubtasks.filter((_, i) => i !== index);
            // Update sort_order
            updated.forEach((subtask, i) => {
              subtask.sort_order = i;
            });
            setLocalSubtasks(updated);
            onChange(updated);
          },
        },
      ]
    );
  };

  const handleEditSubtask = (index: number) => {
    const subtask = localSubtasks[index];
    setEditTitle(subtask.title);
    setEditPoints(subtask.points.toString());
    setEditingIndex(index);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    if (!editTitle.trim()) {
      Alert.alert('Error', 'Enter subtask name');
      return;
    }

    const points = parseInt(editPoints) || 1;
    if (points < 1 || points > 100) {
      Alert.alert('Error', 'Points must be between 1 and 100');
      return;
    }

    const updated = [...localSubtasks];
    updated[editingIndex] = {
      ...updated[editingIndex],
      title: editTitle.trim(),
      points,
    };

    setLocalSubtasks(updated);
    onChange(updated);
    setEditingIndex(null);
    setEditTitle('');
    setEditPoints('');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const updated = [...localSubtasks];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];

    // Update sort_order
    updated.forEach((subtask, i) => {
      subtask.sort_order = i;
    });

    setLocalSubtasks(updated);
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === localSubtasks.length - 1) return;

    const updated = [...localSubtasks];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];

    // Update sort_order
    updated.forEach((subtask, i) => {
      subtask.sort_order = i;
    });

    setLocalSubtasks(updated);
    onChange(updated);
  };

  const totalPoints = localSubtasks.reduce((sum, s) => sum + s.points, 0);

  const renderSubtask = ({ item, index }: { item: any; index: number }) => {
    if (editingIndex === index) {
      return (
        <View style={styles.editRow}>
          <TextInput
            style={styles.editInput}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Subtask name"
            placeholderTextColor={Colors.textSecondary}
          />
          <TextInput
            style={styles.pointsEditInput}
            value={editPoints}
            onChangeText={(text) => setEditPoints(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="Points"
            placeholderTextColor={Colors.textSecondary}
            maxLength={3}
          />
          <TouchableOpacity onPress={handleSaveEdit} style={styles.saveButton}>
            <Ionicons name="checkmark" size={20} color={Colors.success} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditingIndex(null)} style={styles.cancelButton}>
            <Ionicons name="close" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.subtaskRow}>
        <View style={styles.subtaskInfo}>
          <Text style={styles.subtaskNumber}>{index + 1}.</Text>
          <Text style={styles.subtaskTitle}>{item.title}</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{item.points} pts</Text>
          </View>
        </View>
        <View style={styles.subtaskActions}>
          <TouchableOpacity
            onPress={() => handleMoveUp(index)}
            disabled={index === 0}
            style={[styles.actionButton, index === 0 && styles.disabledButton]}
          >
            <Ionicons name="arrow-up" size={16} color={index === 0 ? Colors.gray400 : Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMoveDown(index)}
            disabled={index === localSubtasks.length - 1}
            style={[styles.actionButton, index === localSubtasks.length - 1 && styles.disabledButton]}
          >
            <Ionicons name="arrow-down" size={16} color={index === localSubtasks.length - 1 ? Colors.gray400 : Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleEditSubtask(index)} style={styles.actionButton}>
            <Ionicons name="pencil" size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteSubtask(index)} style={styles.actionButton}>
            <Ionicons name="trash" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subtasks</Text>
        {totalPoints > 0 && (
          <View style={styles.totalPointsBadge}>
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text style={styles.totalPointsText}>Total: {totalPoints} points</Text>
          </View>
        )}
      </View>

      {/* Subtasks List */}
      {localSubtasks.length > 0 && (
        <FlatList
          data={localSubtasks}
          renderItem={renderSubtask}
          keyExtractor={(_, index) => index.toString()}
          style={styles.list}
          scrollEnabled={false}
        />
      )}

      {/* Add New Subtask Form */}
      {!disabled && (
        <View style={styles.addForm}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.titleInput}
              placeholder="Subtask name"
              placeholderTextColor={Colors.textSecondary}
              value={newSubtaskTitle}
              onChangeText={setNewSubtaskTitle}
              editable={!disabled}
            />
            <TextInput
              style={styles.pointsInput}
              placeholder="Points"
              placeholderTextColor={Colors.textSecondary}
              value={newSubtaskPoints}
              onChangeText={(text) => setNewSubtaskPoints(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
              editable={!disabled}
            />
            <TouchableOpacity
              onPress={handleAddSubtask}
              disabled={disabled || !newSubtaskTitle.trim()}
              style={[styles.addButton, (!newSubtaskTitle.trim() || disabled) && styles.disabledButton]}
            >
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Each subtask has its own points value (1-100)
          </Text>
        </View>
      )}

      {localSubtasks.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={48} color={Colors.gray400} />
          <Text style={styles.emptyText}>Add subtasks for detailed task description</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.bodyMedium,
    color: Colors.text.default,
    fontWeight: '600',
  },
  totalPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  totalPointsText: {
    ...Typography.bodySmall,
    color: Colors.accent,
    fontWeight: '600',
  },
  list: {
    marginBottom: Spacing.md,
  },
  subtaskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  subtaskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subtaskNumber: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    width: 20,
  },
  subtaskTitle: {
    ...Typography.bodyMedium,
    color: Colors.text.default,
    flex: 1,
  },
  pointsBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  pointsText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  subtaskActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  disabledButton: {
    opacity: 0.3,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: Spacing.sm,
  },
  editInput: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.text.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray300,
    paddingVertical: Spacing.xs,
  },
  pointsEditInput: {
    width: 60,
    ...Typography.bodyMedium,
    color: Colors.text.default,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray300,
    paddingVertical: Spacing.xs,
    textAlign: 'center',
  },
  saveButton: {
    padding: Spacing.xs,
  },
  cancelButton: {
    padding: Spacing.xs,
  },
  addForm: {
    marginTop: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  titleInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.text.default,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  pointsInput: {
    width: 80,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    ...Typography.bodyMedium,
    color: Colors.text.default,
    borderWidth: 1,
    borderColor: Colors.gray300,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});