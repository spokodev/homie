import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { Badge } from '@/utils/badges';

export interface BadgeCelebrationProps {
  visible: boolean;
  badge: Badge | null;
  onClose: () => void;
}

export function BadgeCelebration({ visible, badge, onClose }: BadgeCelebrationProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);

      // Animate badge entrance
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, badge]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!badge) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.backdrop}>
        <TouchableOpacity
          style={styles.container}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.content}>
            {/* Confetti/Stars Background */}
            <View style={styles.confettiContainer}>
              {[...Array(8)].map((_, i) => (
                <Text key={i} style={[styles.confetti, getConfettiStyle(i)]}>
                  ⭐
                </Text>
              ))}
            </View>

            {/* Badge Icon with Animation */}
            <Animated.View
              style={[
                styles.badgeContainer,
                {
                  transform: [{ scale: scaleAnim }, { rotate }],
                },
              ]}
            >
              <View style={styles.badgeCircle}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
              </View>
            </Animated.View>

            {/* Success Icon */}
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>

            {/* Badge Info */}
            <Text style={styles.title}>Badge Unlocked!</Text>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.description}>{badge.description}</Text>

            {/* Tier Badge */}
            {badge.tier === 'premium' && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={16} color={Colors.accent} />
                <Text style={styles.premiumText}>Premium Badge</Text>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

function getConfettiStyle(index: number): any {
  const positions = [
    { top: 50, left: 30 },
    { top: 80, right: 40 },
    { top: 150, left: 60 },
    { top: 180, right: 70 },
    { bottom: 200, left: 50 },
    { bottom: 180, right: 60 },
    { bottom: 250, left: 90 },
    { bottom: 230, right: 80 },
  ];

  return {
    position: 'absolute' as const,
    ...positions[index],
  };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  confetti: {
    fontSize: 24,
  },
  badgeContainer: {
    marginBottom: Spacing.lg,
  },
  badgeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  badgeIcon: {
    fontSize: 60,
  },
  successIcon: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  badgeName: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  premiumText: {
    ...Typography.labelMedium,
    color: Colors.accent,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    width: '100%',
  },
  closeButtonText: {
    ...Typography.button,
    color: Colors.white,
    textAlign: 'center',
  },
});
