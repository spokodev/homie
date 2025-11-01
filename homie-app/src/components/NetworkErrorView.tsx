import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';

interface NetworkErrorViewProps {
  onRetry: () => void;
  message?: string;
  retrying?: boolean;
}

export function NetworkErrorView({
  onRetry,
  message = 'Failed to load data',
  retrying = false
}: NetworkErrorViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="cloud-offline-outline" size={64} color={Colors.error} />
      </View>

      <Text style={styles.title}>Network Error</Text>
      <Text style={styles.message}>{message}</Text>

      <TouchableOpacity
        style={[styles.retryButton, retrying && styles.retryButtonDisabled]}
        onPress={onRetry}
        disabled={retrying}
      >
        {retrying ? (
          <>
            <Ionicons name="sync" size={20} color={Colors.white} />
            <Text style={styles.retryButtonText}>Retrying...</Text>
          </>
        ) : (
          <>
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        Check your internet connection and try again
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.default,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    minWidth: 150,
  },
  retryButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  hint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
