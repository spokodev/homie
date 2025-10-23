import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePremiumStore } from '@/stores/premium.store';
import { APP_CONFIG } from '@/constants';

interface UsePremiumReturn {
  isPremium: boolean;
  isLoading: boolean;
  subscriptionInfo: any;
  showPremiumModal: () => void;
  requirePremium: (callback: () => void) => void;
  canUseFeature: (feature: keyof typeof APP_CONFIG.limits.premium) => boolean;
  getFeatureLimit: (feature: keyof typeof APP_CONFIG.limits.free) => number | string;
}

/**
 * Hook for managing premium features and subscriptions
 */
export function usePremium(): UsePremiumReturn {
  const router = useRouter();
  const {
    isPremium,
    isLoading,
    subscriptionInfo,
    initialize,
  } = usePremiumStore();

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []);

  /**
   * Show the subscription modal
   */
  const showPremiumModal = useCallback(() => {
    router.push('/(modals)/subscription');
  }, [router]);

  /**
   * Execute callback if premium, otherwise show upgrade modal
   */
  const requirePremium = useCallback((callback: () => void) => {
    if (isPremium) {
      callback();
    } else {
      Alert.alert(
        'Premium Feature 🌟',
        'This feature requires a premium subscription. Upgrade now to unlock all features!',
        [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: showPremiumModal,
            style: 'default',
          },
        ]
      );
    }
  }, [isPremium, showPremiumModal]);

  /**
   * Check if user can use a specific feature
   */
  const canUseFeature = useCallback((feature: keyof typeof APP_CONFIG.limits.premium): boolean => {
    if (isPremium) return true;

    const freeLimit = APP_CONFIG.limits.free[feature as keyof typeof APP_CONFIG.limits.free];
    const premiumLimit = APP_CONFIG.limits.premium[feature];

    // If feature is unlimited in premium but limited in free
    if (premiumLimit === 'unlimited' && typeof freeLimit === 'number') {
      return freeLimit > 0;
    }

    // If feature is not available in free
    if (freeLimit === undefined || freeLimit === 0) {
      return false;
    }

    return true;
  }, [isPremium]);

  /**
   * Get the limit for a feature based on subscription status
   */
  const getFeatureLimit = useCallback((feature: keyof typeof APP_CONFIG.limits.free): number | string => {
    if (isPremium) {
      const premiumLimit = APP_CONFIG.limits.premium[feature as keyof typeof APP_CONFIG.limits.premium];
      return premiumLimit || 'unlimited';
    }
    return APP_CONFIG.limits.free[feature];
  }, [isPremium]);

  return {
    isPremium,
    isLoading,
    subscriptionInfo,
    showPremiumModal,
    requirePremium,
    canUseFeature,
    getFeatureLimit,
  };
}

/**
 * Hook to check if a specific premium feature is available
 */
export function usePremiumFeature(feature: keyof typeof APP_CONFIG.limits.premium): {
  isAvailable: boolean;
  limit: number | string;
  requirePremium: () => void;
} {
  const { isPremium, showPremiumModal } = usePremium();

  const isAvailable = isPremium || APP_CONFIG.limits.free[feature as keyof typeof APP_CONFIG.limits.free] !== undefined;

  const limit = isPremium
    ? APP_CONFIG.limits.premium[feature]
    : APP_CONFIG.limits.free[feature as keyof typeof APP_CONFIG.limits.free];

  const requirePremium = useCallback(() => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature Required',
        `Upgrade to premium to get ${APP_CONFIG.limits.premium[feature]} ${feature}!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: showPremiumModal },
        ]
      );
    }
  }, [isPremium, feature, showPremiumModal]);

  return {
    isAvailable,
    limit,
    requirePremium,
  };
}

/**
 * Hook to track premium feature usage
 */
export function usePremiumTracking() {
  const { isPremium } = usePremium();

  const trackFeatureAttempt = useCallback((featureName: string) => {
    if (!isPremium) {
      // Track when free users try to use premium features
      console.log('Free user attempted premium feature:', featureName);
      // You can send this to analytics (PostHog, etc.)
    }
  }, [isPremium]);

  const trackPurchaseAttempt = useCallback((plan: 'monthly' | 'yearly') => {
    console.log('User attempted purchase:', plan);
    // Track purchase attempts for analytics
  }, []);

  return {
    trackFeatureAttempt,
    trackPurchaseAttempt,
  };
}