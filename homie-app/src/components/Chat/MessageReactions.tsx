import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useMessageReactions, COMMON_REACTIONS } from '@/hooks/useMessageReactions';

interface MessageReactionsProps {
  messageId: string;
  onReact: (emoji: string) => void;
  showPicker?: boolean;
  currentMemberId?: string;
}

export function MessageReactions({
  messageId,
  onReact,
  showPicker = false,
  currentMemberId,
}: MessageReactionsProps) {
  const colors = useThemeColors();
  const { data: reactions = [] } = useMessageReactions(messageId);
  const styles = createStyles(colors);

  const hasUserReacted = (emoji: string) => {
    const reaction = reactions.find(r => r.emoji === emoji);
    return reaction?.member_ids.includes(currentMemberId || '') || false;
  };

  return (
    <View style={styles.container}>
      {/* Existing reactions */}
      {reactions.length > 0 && (
        <View style={styles.reactionsRow}>
          {reactions.map((reaction, index) => {
            const userReacted = hasUserReacted(reaction.emoji);
            return (
              <TouchableOpacity
                key={`${reaction.emoji}-${index}`}
                style={[
                  styles.reactionBubble,
                  userReacted && styles.reactionBubbleActive,
                ]}
                onPress={() => onReact(reaction.emoji)}
              >
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                <Text style={[
                  styles.reactionCount,
                  userReacted && styles.reactionCountActive,
                ]}>
                  {reaction.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Reaction picker */}
      {showPicker && (
        <View style={styles.pickerContainer}>
          <View style={styles.picker}>
            {COMMON_REACTIONS.map((emoji, index) => (
              <TouchableOpacity
                key={`${emoji}-${index}`}
                style={styles.pickerButton}
                onPress={() => onReact(emoji)}
              >
                <Text style={styles.pickerEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    marginTop: Spacing.xs,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    gap: 2,
  },
  reactionBubbleActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    ...Typography.labelSmall,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  reactionCountActive: {
    color: colors.primary,
  },
  pickerContainer: {
    marginTop: Spacing.xs,
  },
  picker: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.large,
    padding: Spacing.xs,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.medium,
  },
  pickerEmoji: {
    fontSize: 24,
  },
});
