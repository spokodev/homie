import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Typography, Spacing, BorderRadius, Shadows } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { APP_CONFIG } from '@/constants';
import { usePremiumStore } from '@/stores/premium.store';
import { trackEvent, trackPremiumEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

const FEATURES = [
  { icon: '🏠', title: 'Unlimited Households', free: '1', premium: 'Unlimited' },
  { icon: '👥', title: 'Family Members', free: '5', premium: 'Unlimited' },
  { icon: '📝', title: 'Room Notes', free: '3 per room', premium: 'Unlimited' },
  { icon: '🏆', title: 'Achievements', free: '5 badges', premium: '20+ badges' },
  { icon: '📊', title: 'Analytics Dashboard', free: '❌', premium: '✅' },
  { icon: '🎯', title: 'Max Level', free: 'Level 20', premium: 'Level 50' },
  { icon: '🌟', title: 'Captain Bonus', free: 'Basic', premium: 'Premium' },
  { icon: '🎨', title: 'Themes', free: '1', premium: '5+' },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const {
    monthlyPackage,
    yearlyPackage,
    isPurchasing,
    isRestoring,
    error,
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
    clearError,
    initialize,
  } = usePremiumStore();

  useEffect(() => {
    initialize();
    // Track premium screen viewed
    trackEvent(ANALYTICS_EVENTS.PREMIUM_UPGRADE_VIEWED);
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const handlePurchase = async () => {
    // Track upgrade button clicked
    trackEvent(ANALYTICS_EVENTS.PREMIUM_UPGRADE_CLICKED, {
      plan: selectedPlan,
    });

    const success = selectedPlan === 'monthly'
      ? await purchaseMonthly()
      : await purchaseYearly();

    if (success) {
      // Track successful purchase
      trackPremiumEvent(ANALYTICS_EVENTS.PREMIUM_PURCHASE, {
        plan: selectedPlan,
        price: selectedPlan === 'monthly'
          ? APP_CONFIG.pricing.premium.monthly
          : APP_CONFIG.pricing.premium.yearly,
        source: 'subscription_screen',
      });

      Alert.alert(
        '🎉 Welcome to Premium!',
        'Thank you for supporting Homie! Enjoy all premium features.',
        [{ text: 'Awesome!', onPress: () => router.back() }]
      );
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();

    if (success) {
      Alert.alert(
        'Subscription Restored!',
        'Your premium subscription has been restored.',
        [{ text: 'Great!', onPress: () => router.back() }]
      );
    }
  };

  const monthlyPrice = monthlyPackage?.product.priceString || '$4.99';
  const yearlyPrice = yearlyPackage?.product.priceString || '$49.99';
  const yearlySavings = '$10';

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
          <View style={styles.crown}>
            <MaterialCommunityIcons name="crown" size={48} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>Unlock Full Potential</Text>
          <Text style={styles.heroSubtitle}>
            Get unlimited access to all features and make home management even more fun!
          </Text>
        </Animated.View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {/* Monthly Plan */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planHeader}>
                <View style={styles.radioButton}>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <View>
                  <Text style={styles.planTitle}>Monthly</Text>
                  <Text style={styles.planPrice}>{monthlyPrice}/month</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Yearly Plan */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('yearly')}
            >
              {selectedPlan === 'yearly' && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <View style={styles.radioButton}>
                  {selectedPlan === 'yearly' && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>Yearly</Text>
                  <Text style={styles.planPrice}>{yearlyPrice}/year</Text>
                  <Text style={styles.savingsText}>Save {yearlySavings}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What you'll get</Text>
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeInDown.delay(300 + index * 50).duration(500)}
              style={styles.featureRow}
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <View style={styles.featureComparison}>
                <Text style={styles.featureFree}>{feature.free}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.gray500} />
                <Text style={styles.featurePremium}>{feature.premium}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.purchaseButton, isPurchasing && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <>
              <Text style={styles.purchaseButtonText}>
                Continue with {selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'}
              </Text>
              <Text style={styles.purchaseButtonPrice}>
                {selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRestore}
          disabled={isRestoring}
          style={styles.restoreButton}
        >
          {isRestoring ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Subscriptions will automatically renew unless cancelled at least 24 hours before
          the renewal date.
        </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h4,
    color: colors.text,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  crown: {
    width: 80,
    height: 80,
    backgroundColor: colors.accent + '20',
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...Typography.h2,
    color: colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...Typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  plansContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    ...Shadows.small,
  },
  planCardSelected: {
    borderColor: colors.primary,
    ...Shadows.medium,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.small,
  },
  popularText: {
    ...Typography.labelSmall,
    color: colors.card,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  planTitle: {
    ...Typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  planPrice: {
    ...Typography.h4,
    color: colors.primary,
    marginTop: Spacing.xs,
  },
  savingsText: {
    ...Typography.labelMedium,
    color: colors.success,
    marginTop: Spacing.xs,
  },
  featuresContainer: {
    paddingHorizontal: Spacing.lg,
  },
  featuresTitle: {
    ...Typography.h4,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  featureTitle: {
    ...Typography.bodyMedium,
    color: colors.text,
    flex: 1,
  },
  featureComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  featureFree: {
    ...Typography.bodySmall,
    color: colors.gray500,
  },
  featurePremium: {
    ...Typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },
  bottomContainer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    ...Typography.button,
    color: colors.card,
  },
  purchaseButtonPrice: {
    ...Typography.bodySmall,
    color: colors.card,
    opacity: 0.9,
  },
  restoreButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  restoreText: {
    ...Typography.bodyMedium,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    ...Typography.bodySmall,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});