import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function LoadingState({
  message = 'Loading...',
  size = 'large',
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={8} />
        <View style={styles.cardContent}>
          <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
          <Skeleton width="90%" height={14} />
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={60} height={14} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profileSkeleton}>
      <Skeleton width={80} height={80} borderRadius={40} style={{ alignSelf: 'center', marginBottom: 16 }} />
      <Skeleton width="60%" height={24} style={{ alignSelf: 'center', marginBottom: 8 }} />
      <Skeleton width="40%" height={16} style={{ alignSelf: 'center', marginBottom: 24 }} />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Skeleton width={60} height={32} style={{ marginBottom: 8 }} />
          <Skeleton width={80} height={14} />
        </View>
        <View style={styles.statItem}>
          <Skeleton width={60} height={32} style={{ marginBottom: 8 }} />
          <Skeleton width={80} height={14} />
        </View>
        <View style={styles.statItem}>
          <Skeleton width={60} height={32} style={{ marginBottom: 8 }} />
          <Skeleton width={80} height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  fullScreen: {
    backgroundColor: Colors.background,
  },
  message: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  skeleton: {
    backgroundColor: Colors.gray300,
    overflow: 'hidden',
  },
  cardSkeleton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileSkeleton: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
});
