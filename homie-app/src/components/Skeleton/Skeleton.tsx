import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, StyleSheet } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children
}: SkeletonProps) {
  const colors = useThemeColors();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (children) {
    return (
      <View style={[{ width, height }, style]}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border.default,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-built skeleton layouts for common UI patterns
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface.primary }, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={120} height={16} />
          <Skeleton width={80} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton height={60} style={{ marginTop: 12 }} />
      <View style={styles.cardFooter}>
        <Skeleton width={60} height={20} />
        <Skeleton width={80} height={20} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={{ marginBottom: 12 }} />
      ))}
    </View>
  );
}

export function SkeletonText({
  lines = 3,
  widths = ['100%', '90%', '75%']
}: {
  lines?: number;
  widths?: (string | number)[]
}) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={widths[index] || widths[widths.length - 1]}
          height={14}
          style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
        />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

export function SkeletonButton({ width = 120, height = 44 }: { width?: number | string; height?: number }) {
  return <Skeleton width={width} height={height} borderRadius={22} />;
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});