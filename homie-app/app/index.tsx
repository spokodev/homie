import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/theme';
import { APP_CONFIG } from '@/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const logoScale = useSharedValue(0);
  const dogWave = useSharedValue(0);

  useEffect(() => {
    // Animate logo entrance
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });

    // Animate dog waving
    dogWave.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(15, { duration: 300 }),
          withTiming(-15, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const dogAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dogWave.value}deg` }],
  }));

  const handleGetStarted = () => {
    router.push('/(auth)/signup');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.house}>
            <View style={styles.roof} />
            <View style={styles.houseBody}>
              <Animated.Text style={[styles.dogEmoji, dogAnimatedStyle]}>
                🐕
              </Animated.Text>
            </View>
          </View>
          <Text style={styles.appName}>{APP_CONFIG.name}</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View entering={FadeIn.delay(300).duration(500)}>
          <Text style={styles.tagline}>{APP_CONFIG.tagline}</Text>
          <Text style={styles.description}>{APP_CONFIG.description}</Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={styles.buttonContainer}
          entering={FadeIn.delay(500).duration(500)}
        >
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already a member? </Text>
            <TouchableOpacity onPress={handleSignIn}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  house: {
    width: 120,
    height: 120,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 60,
    borderRightWidth: 60,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.primary,
  },
  houseBody: {
    width: 100,
    height: 70,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.small,
  },
  dogEmoji: {
    fontSize: 40,
  },
  appName: {
    ...Typography.h1,
    color: Colors.primary,
    marginTop: Spacing.md,
  },
  tagline: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
    width: '100%',
    maxWidth: 280,
    ...Shadows.medium,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.white,
    textAlign: 'center',
  },
  signInContainer: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
  },
  signInText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  signInLink: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});