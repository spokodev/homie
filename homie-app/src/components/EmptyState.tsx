import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  emoji?: string;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  emoji,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {emoji ? (
        <Text style={styles.emoji}>{emoji}</Text>
      ) : (
        <Ionicons name={icon} size={80} color={Colors.gray300} />
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.white,
  },
});
