import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { HapticFeedback } from '@/utils/haptics';
import { Typography, Spacing } from '@/theme';

const { width, height } = Dimensions.get('window');

interface SuccessAnimationProps {
  visible: boolean;
  points?: number;
  message?: string;
  emoji?: string;
  onComplete?: () => void;
  duration?: number;
}

export function SuccessAnimation({
  visible,
  points,
  message = 'Great job!',
  emoji = '🎉',
  onComplete,
  duration = 2000,
}: SuccessAnimationProps) {
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      HapticFeedback.success();

      // Start animations
      Animated.parallel([
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Scale up with bounce
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 5,
          bounciness: 10,
          useNativeDriver: true,
        }),
        // Slide up
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        // Rotate
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideAnimation();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset animations
      translateY.setValue(50);
      rotateAnim.setValue(0);
      onComplete?.();
    });
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      pointerEvents="none"
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              shadowColor: colors.primary,
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate },
                { translateY },
              ],
            },
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={[styles.message, { color: colors.text.default }]}>
            {message}
          </Text>
          {points && (
            <View style={[styles.pointsBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.pointsText, { color: colors.text.inverse }]}>
                +{points} points
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// Confetti particle for extra celebration
export function ConfettiAnimation({ visible }: { visible: boolean }) {
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    key: i,
    x: useRef(new Animated.Value(Math.random() * width)).current,
    y: useRef(new Animated.Value(-50)).current,
    rotate: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(1)).current,
    color: ['#FF6B35', '#F7931E', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5],
  }));

  useEffect(() => {
    if (visible) {
      particles.forEach((particle, index) => {
        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: height + 50,
            duration: 2000 + Math.random() * 1000,
            delay: index * 50,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotate, {
            toValue: 4,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 1000,
              delay: 1800,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((particle) => {
        const rotate = particle.rotate.interpolate({
          inputRange: [0, 4],
          outputRange: ['0deg', '1440deg'],
        });

        return (
          <Animated.View
            key={particle.key}
            style={[
              styles.confetti,
              {
                backgroundColor: particle.color,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { rotate },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    padding: Spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 250,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  pointsBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginTop: Spacing.sm,
  },
  pointsText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});