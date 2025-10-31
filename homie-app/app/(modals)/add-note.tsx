import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { TextArea } from '@/components/Form/TextArea';
import { Button } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useCreateRoomNote } from '@/hooks/useRoomNotes';
import { logError } from '@/utils/errorHandling';

const NOTE_COLORS = [
  { id: '1', color: '#FFD93D', name: 'Yellow' },
  { id: '2', color: '#FF6B6B', name: 'Coral' },
  { id: '3', color: '#4ECDC4', name: 'Teal' },
  { id: '4', color: '#95E1D3', name: 'Mint' },
  { id: '5', color: '#FFA502', name: 'Orange' },
  { id: '6', color: '#C7CEEA', name: 'Purple' },
];

export default function AddNoteScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ roomId: string; roomName: string }>();
  const { member } = useHousehold();
  const { showToast } = useToast();
  const createNote = useCreateRoomNote();

  const [noteContent, setNoteContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0].color);
  const [errors, setErrors] = useState<{ content?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!member?.id) {
      showToast('No member found', 'error');
      return;
    }

    // Validate
    const trimmedContent = noteContent.trim();
    if (!trimmedContent) {
      setErrors({ content: 'Note content is required' });
      return;
    }

    if (trimmedContent.length < 3) {
      setErrors({ content: 'Note must be at least 3 characters' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createNote.mutateAsync({
        room_id: params.roomId,
        member_id: member.id,
        content: trimmedContent,
        color: selectedColor,
      });

      showToast('Note added!', 'success');
      router.back();
    } catch (err: any) {
      logError(err, 'Create Note');

      // Check for free user limit error
      if (err.message?.includes('Free users')) {
        showToast(err.message, 'error');
      } else {
        showToast('Failed to create note. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Note</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Room Name */}
        <View style={styles.roomBadge}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.roomText}>{params.roomName}</Text>
        </View>

        {/* Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={[styles.notePreview, { backgroundColor: selectedColor }]}>
            <Text style={styles.notePreviewText}>
              {noteContent || 'Your note will appear here...'}
            </Text>
            <View style={styles.notePreviewFooter}>
              <Text style={styles.notePreviewAuthor}>
                {member?.avatar} {member?.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Note Content */}
        <View style={styles.section}>
          <TextArea
            label="Note Content"
            placeholder="Write your reminder or note here..."
            value={noteContent}
            onChangeText={(text) => {
              setNoteContent(text);
              if (errors.content) setErrors({ ...errors, content: undefined });
            }}
            error={errors.content}
            maxLength={500}
            showCounter
            required
            minHeight={120}
          />
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note Color</Text>
          <View style={styles.colorGrid}>
            {NOTE_COLORS.map((colorOption) => (
              <TouchableOpacity
                key={colorOption.id}
                style={[
                  styles.colorButton,
                  { backgroundColor: colorOption.color },
                  selectedColor === colorOption.color && styles.colorButtonActive,
                ]}
                onPress={() => setSelectedColor(colorOption.color)}
              >
                {selectedColor === colorOption.color && (
                  <Ionicons name="checkmark" size={24} color={colors.text} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsBox}>
          <Ionicons name="bulb-outline" size={20} color={colors.accent} />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Tips:</Text>
            <Text style={styles.tipsText}>
              • Use notes for shopping lists, cleaning reminders, or maintenance schedules{'\n'}
              • Pin important notes to keep them at the top{'\n'}
              • Set expiry dates for time-sensitive reminders
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={isSubmitting ? 'Creating...' : 'Create Note'}
          onPress={handleSubmit}
          disabled={isSubmitting || !noteContent.trim()}
          leftIcon={
            isSubmitting ? (
              <ActivityIndicator size="small" color={colors.card} />
            ) : (
              <Ionicons name="add" size={20} color={colors.card} />
            )
          }
        />
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h4,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  roomText: {
    ...Typography.labelMedium,
    color: colors.textSecondary,
  },
  previewSection: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.labelLarge,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  notePreview: {
    minHeight: 150,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notePreviewText: {
    ...Typography.bodyMedium,
    color: colors.text,
    flex: 1,
    marginTop: Spacing.sm,
  },
  notePreviewFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: Spacing.sm,
    marginTop: Spacing.md,
  },
  notePreviewAuthor: {
    ...Typography.labelSmall,
    color: colors.text,
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorButton: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorButtonActive: {
    borderColor: colors.text,
  },
  tipsBox: {
    flexDirection: 'row',
    backgroundColor: colors.accent + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    ...Typography.labelLarge,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  tipsText: {
    ...Typography.bodySmall,
    color: colors.text,
    lineHeight: 18,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
