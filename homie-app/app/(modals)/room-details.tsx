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
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/Modal/ConfirmDialog';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useRoomNotes, useDeleteRoomNote, useTogglePinNote } from '@/hooks/useRoomNotes';
import { useDeleteRoom } from '@/hooks/useRooms';
import { usePremiumStore } from '@/stores/premium.store';
import { logError } from '@/utils/errorHandling';


export default function RoomDetailsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ roomId: string; roomName: string }>();
  const { household, member } = useHousehold();
  const { showToast } = useToast();
  const isPremium = usePremiumStore((state) => state.isPremium);

  const { data: notes = [], isLoading, error } = useRoomNotes(params.roomId);
  const deleteNote = useDeleteRoomNote();
  const togglePin = useTogglePinNote();
  const deleteRoom = useDeleteRoom();

  const [showDeleteRoomDialog, setShowDeleteRoomDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Create styles early to avoid hoisting issues
  const styles = createStyles(colors);

  const canAddMoreNotes = isPremium || notes.length < 3;

  const handleAddNote = () => {
    if (!canAddMoreNotes) {
      showToast('Free users can have up to 3 notes per room. Upgrade to Premium!', 'error');
      return;
    }
    router.push({
      pathname: '/(modals)/add-note',
      params: { roomId: params.roomId, roomName: params.roomName },
    });
  };

  const handleTogglePin = async (noteId: string, currentPinStatus: boolean) => {
    try {
      await togglePin.mutateAsync({
        id: noteId,
        roomId: params.roomId,
        isPinned: !currentPinStatus,
      });
      showToast(currentPinStatus ? 'Note unpinned' : 'Note pinned', 'success');
    } catch (err) {
      logError(err, 'Toggle Pin Note');
      showToast('Failed to update note', 'error');
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNote.mutateAsync({
        noteId: noteToDelete,
        roomId: params.roomId,
      });
      showToast('Note deleted', 'success');
      setNoteToDelete(null);
    } catch (err) {
      logError(err, 'Delete Note');
      showToast('Failed to delete note', 'error');
    }
  };

  const handleDeleteRoom = async () => {
    if (!household?.id) return;

    try {
      await deleteRoom.mutateAsync({
        roomId: params.roomId,
        householdId: household.id,
      });
      showToast('Room deleted', 'success');
      router.back();
    } catch (err) {
      logError(err, 'Delete Room');
      showToast('Failed to delete room', 'error');
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>Failed to load notes</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {params.roomName}
        </Text>
        <TouchableOpacity
          onPress={() => setShowDeleteRoomDialog(true)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      ) : (
        <>
          {/* Notes List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {notes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={colors.gray500} />
                <Text style={styles.emptyStateTitle}>No notes yet</Text>
                <Text style={styles.emptyStateText}>
                  Add sticky notes to leave reminders for this room
                </Text>
              </View>
            ) : (
              <View style={styles.notesGrid}>
                {notes.map((note) => (
                  <View
                    key={note.id}
                    style={[styles.noteCard, { backgroundColor: note.color }]}
                  >
                    {/* Pin Button */}
                    <TouchableOpacity
                      style={styles.pinButton}
                      onPress={() => handleTogglePin(note.id, note.is_pinned)}
                    >
                      <Ionicons
                        name={note.is_pinned ? 'pin' : 'pin-outline'}
                        size={20}
                        color={colors.text}
                      />
                    </TouchableOpacity>

                    {/* Delete Button */}
                    {note.member_id === member?.id && (
                      <TouchableOpacity
                        style={styles.noteDeleteButton}
                        onPress={() => setNoteToDelete(note.id)}
                      >
                        <Ionicons name="close" size={20} color={colors.text} />
                      </TouchableOpacity>
                    )}

                    {/* Content */}
                    <Text style={styles.noteContent}>{note.content}</Text>

                    {/* Footer */}
                    <View style={styles.noteFooter}>
                      <Text style={styles.noteAuthor}>
                        {note.member_avatar} {note.member_name}
                      </Text>
                      {note.expires_at && (
                        <Text style={styles.noteExpiry}>
                          Expires: {new Date(note.expires_at).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Premium Limit Info */}
            {!isPremium && notes.length > 0 && (
              <View style={styles.limitInfo}>
                <Text style={styles.limitText}>
                  {notes.length} / 3 notes used
                  {notes.length >= 3 && ' • Upgrade to Premium for unlimited notes'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Add Note Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.addButton, !canAddMoreNotes && styles.addButtonDisabled]}
              onPress={handleAddNote}
            >
              <Ionicons name="add" size={24} color={colors.card} />
              <Text style={styles.addButtonText}>Add Note</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Delete Room Dialog */}
      <ConfirmDialog
        visible={showDeleteRoomDialog}
        onClose={() => setShowDeleteRoomDialog(false)}
        onConfirm={handleDeleteRoom}
        title="Delete Room"
        message={`Are you sure you want to delete ${params.roomName}? All notes in this room will be deleted.`}
        confirmVariant="danger"
        icon="trash"
      />

      {/* Delete Note Dialog */}
      <ConfirmDialog
        visible={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmVariant="danger"
        icon="trash"
      />
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h4,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.h4,
    color: colors.error,
    marginTop: Spacing.md,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateTitle: {
    ...Typography.h4,
    color: colors.text,
    marginTop: Spacing.md,
  },
  emptyStateText: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  noteCard: {
    width: '100%',
    minHeight: 150,
    padding: Spacing.md,
    margin: Spacing.xs,
    borderRadius: BorderRadius.medium,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pinButton: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteDeleteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteContent: {
    ...Typography.bodyMedium,
    color: colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    flex: 1,
  },
  noteFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: Spacing.sm,
  },
  noteAuthor: {
    ...Typography.labelSmall,
    color: colors.text,
    fontWeight: '600',
  },
  noteExpiry: {
    ...Typography.labelSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  limitInfo: {
    padding: Spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.lg,
  },
  limitText: {
    ...Typography.bodySmall,
    color: colors.text,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  addButtonDisabled: {
    backgroundColor: colors.gray500,
    opacity: 0.5,
  },
  addButtonText: {
    ...Typography.button,
    color: colors.card,
  },
});
