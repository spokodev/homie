import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import {
  useTaskTemplates,
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeleteTaskTemplate,
  TaskTemplate,
} from '@/hooks/useTaskTemplates';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';

export default function ManageTemplatesModal() {
  const colors = useThemeColors();
  const router = useRouter();
  const { household, member } = useHousehold();
  const { showToast } = useToast();

  const { data: templates = [], isLoading } = useTaskTemplates(household?.id);
  const createTemplate = useCreateTaskTemplate();
  const updateTemplate = useUpdateTaskTemplate();
  const deleteTemplate = useDeleteTaskTemplate();

  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('📋');
  const [formDescription, setFormDescription] = useState('');
  const [formPoints, setFormPoints] = useState('10');
  const [formMinutes, setFormMinutes] = useState('');

  const styles = createStyles(colors);

  const resetForm = () => {
    setFormName('');
    setFormIcon('📋');
    setFormDescription('');
    setFormPoints('10');
    setFormMinutes('');
    setEditingTemplate(null);
    setShowAddForm(false);
  };

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormIcon(template.icon);
    setFormDescription(template.description || '');
    setFormPoints(template.points.toString());
    setFormMinutes(template.estimated_minutes?.toString() || '');
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }

    if (!household?.id || !member?.id) return;

    const points = parseInt(formPoints) || 10;
    const minutes = formMinutes ? parseInt(formMinutes) : undefined;

    try {
      if (editingTemplate) {
        // Update existing template
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          name: formName.trim(),
          icon: formIcon,
          description: formDescription.trim() || undefined,
          points,
          estimated_minutes: minutes,
        });
        showToast('Template updated', 'success');
      } else {
        // Create new template
        await createTemplate.mutateAsync({
          household_id: household.id,
          name: formName.trim(),
          icon: formIcon,
          description: formDescription.trim() || undefined,
          points,
          estimated_minutes: minutes,
          created_by: member.id,
        });
        showToast('Template created', 'success');
      }
      resetForm();
    } catch (error: any) {
      showToast(error.message || 'Failed to save template', 'error');
    }
  };

  const handleDelete = (template: TaskTemplate) => {
    if (template.is_system) {
      showToast('Cannot delete system templates', 'error');
      return;
    }

    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTemplate.mutateAsync({
                templateId: template.id,
                householdId: template.household_id,
              });
              showToast('Template deleted', 'success');
            } catch (error: any) {
              showToast(error.message || 'Failed to delete template', 'error');
            }
          },
        },
      ]
    );
  };

  const renderTemplate = ({ item }: { item: TaskTemplate }) => (
    <View style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <Text style={styles.templateIcon}>{item.icon}</Text>
        <View style={styles.templateInfo}>
          <View style={styles.templateTitleRow}>
            <Text style={styles.templateName}>{item.name}</Text>
            {item.is_system && (
              <View style={styles.systemBadge}>
                <Text style={styles.systemBadgeText}>Default</Text>
              </View>
            )}
          </View>
          {item.description && (
            <Text style={styles.templateDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.templateMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color={colors.accent} />
              <Text style={styles.metaText}>{item.points} pts</Text>
            </View>
            {item.estimated_minutes && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{item.estimated_minutes} min</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.templateActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="pencil" size={18} color={colors.primary} />
        </TouchableOpacity>
        {!item.is_system && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Task Templates</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(!showAddForm)}
          style={styles.addButton}
        >
          <Ionicons name={showAddForm ? "close" : "add"} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>
            {editingTemplate ? 'Edit Template' : 'New Template'}
          </Text>

          <View style={styles.formField}>
            <Text style={styles.label}>Icon</Text>
            <TextInput
              style={styles.iconInput}
              value={formIcon}
              onChangeText={setFormIcon}
              maxLength={2}
              placeholder="📋"
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g., Clean Kitchen"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formDescription}
              onChangeText={setFormDescription}
              placeholder="Optional description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={styles.label}>Points</Text>
              <TextInput
                style={styles.input}
                value={formPoints}
                onChangeText={(text) => setFormPoints(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={styles.label}>Minutes</Text>
              <TextInput
                style={styles.input}
                value={formMinutes}
                onChangeText={(text) => setFormMinutes(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="Optional"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.formActions}>
            <Button
              title="Cancel"
              onPress={resetForm}
              variant="outline"
              style={{ flex: 1 }}
            />
            <Button
              title={editingTemplate ? 'Update' : 'Create'}
              onPress={handleSave}
              style={{ flex: 1 }}
              loading={createTemplate.isPending || updateTemplate.isPending}
            />
          </View>
        </ScrollView>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={renderTemplate}
          contentContainerStyle={styles.templatesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={colors.gray400} />
              <Text style={styles.emptyText}>No templates yet</Text>
              <Text style={styles.emptyHint}>
                Create templates for tasks you do often
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: Spacing.xs,
  },
  formContainer: {
    backgroundColor: colors.card,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formTitle: {
    ...Typography.h4,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  formField: {
    marginBottom: Spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  label: {
    ...Typography.labelMedium,
    color: colors.text,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  input: {
    ...Typography.bodyLarge,
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  iconInput: {
    ...Typography.bodyLarge,
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    fontSize: 32,
    textAlign: 'center',
    width: 80,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: Spacing.md,
  },
  templatesList: {
    padding: Spacing.lg,
  },
  templateCard: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  templateName: {
    ...Typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  systemBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  systemBadgeText: {
    ...Typography.labelSmall,
    color: colors.primary,
    fontSize: 10,
  },
  templateDescription: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  templateMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  templateActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    ...Typography.h4,
    color: colors.text,
    marginTop: Spacing.md,
  },
  emptyHint: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
