import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { revenueCat, PRODUCT_IDS, CustomerInfo, PurchasesPackage } from '@/lib/revenuecat';

interface SubscriptionInfo {
  isActive: boolean;
  expirationDate?: string;
  willRenew?: boolean;
  productId?: string;
  isTrial?: boolean;
}

interface PremiumState {
  // Subscription status
  isPremium: boolean;
  subscriptionInfo: SubscriptionInfo | null;

  // Available packages
  packages: PurchasesPackage[];
  monthlyPackage: PurchasesPackage | null;
  yearlyPackage: PurchasesPackage | null;

  // Loading states
  isLoading: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;

  // Error handling
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  checkPremiumStatus: () => Promise<void>;
  loadPackages: () => Promise<void>;
  purchaseMonthly: () => Promise<boolean>;
  purchaseYearly: () => Promise<boolean>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  clearError: () => void;

  // User management
  loginUser: (userId: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      // Initial state
      isPremium: false,
      subscriptionInfo: null,
      packages: [],
      monthlyPackage: null,
      yearlyPackage: null,
      isLoading: false,
      isPurchasing: false,
      isRestoring: false,
      error: null,

      // Initialize RevenueCat and check status
      initialize: async () => {
        try {
          set({ isLoading: true, error: null });

          // Configure RevenueCat
          await revenueCat.configure();

          // Check premium status
          await get().checkPremiumStatus();

          // Load available packages
          await get().loadPackages();
        } catch (error) {
          console.error('Failed to initialize premium store:', error);
          set({ error: 'Failed to initialize subscriptions' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Check current premium status
      checkPremiumStatus: async () => {
        try {
          const isPremium = await revenueCat.isPremium();
          const subscriptionInfo = await revenueCat.getSubscriptionStatus();

          set({
            isPremium,
            subscriptionInfo: subscriptionInfo.isActive ? subscriptionInfo : null
          });
        } catch (error) {
          console.error('Failed to check premium status:', error);
          set({ isPremium: false, subscriptionInfo: null });
        }
      },

      // Load available packages
      loadPackages: async () => {
        try {
          const packages = await revenueCat.getPackages();

          // Find monthly and yearly packages
          const monthlyPackage = packages.find(
            (pkg) => pkg.product.identifier === PRODUCT_IDS.PREMIUM_MONTHLY
          ) || null;

          const yearlyPackage = packages.find(
            (pkg) => pkg.product.identifier === PRODUCT_IDS.PREMIUM_YEARLY
          ) || null;

          set({ packages, monthlyPackage, yearlyPackage });
        } catch (error) {
          console.error('Failed to load packages:', error);
          set({ packages: [], monthlyPackage: null, yearlyPackage: null });
        }
      },

      // Purchase monthly subscription
      purchaseMonthly: async () => {
        const { monthlyPackage } = get();
        if (!monthlyPackage) {
          set({ error: 'Monthly subscription not available' });
          return false;
        }

        return await get().purchasePackage(monthlyPackage);
      },

      // Purchase yearly subscription
      purchaseYearly: async () => {
        const { yearlyPackage } = get();
        if (!yearlyPackage) {
          set({ error: 'Yearly subscription not available' });
          return false;
        }

        return await get().purchasePackage(yearlyPackage);
      },

      // Purchase a specific package
      purchasePackage: async (pkg: PurchasesPackage) => {
        try {
          set({ isPurchasing: true, error: null });

          const result = await revenueCat.purchasePackage(pkg);

          if (result.success) {
            // Update premium status
            await get().checkPremiumStatus();
            return true;
          } else {
            set({ error: result.error || 'Purchase failed' });
            return false;
          }
        } catch (error) {
          console.error('Purchase failed:', error);
          set({ error: 'Purchase failed. Please try again.' });
          return false;
        } finally {
          set({ isPurchasing: false });
        }
      },

      // Restore previous purchases
      restorePurchases: async () => {
        try {
          set({ isRestoring: true, error: null });

          const result = await revenueCat.restorePurchases();

          if (result.success) {
            // Update premium status
            await get().checkPremiumStatus();

            if (get().isPremium) {
              return true;
            } else {
              set({ error: 'No active subscriptions found' });
              return false;
            }
          } else {
            set({ error: result.error || 'Restore failed' });
            return false;
          }
        } catch (error) {
          console.error('Restore failed:', error);
          set({ error: 'Failed to restore purchases' });
          return false;
        } finally {
          set({ isRestoring: false });
        }
      },

      // Clear error message
      clearError: () => {
        set({ error: null });
      },

      // Login user to RevenueCat
      loginUser: async (userId: string) => {
        try {
          await revenueCat.login(userId);
          await get().checkPremiumStatus();
        } catch (error) {
          console.error('Failed to login user to RevenueCat:', error);
        }
      },

      // Logout user from RevenueCat
      logoutUser: async () => {
        try {
          await revenueCat.logout();
          set({ isPremium: false, subscriptionInfo: null });
        } catch (error) {
          console.error('Failed to logout user from RevenueCat:', error);
        }
      },
    }),
    {
      name: 'premium-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      // Only persist certain fields
      partialize: (state) => ({
        isPremium: state.isPremium,
        subscriptionInfo: state.subscriptionInfo,
      }),
    }
  )
);

// Helper selectors
export const selectIsPremium = (state: PremiumState) => state.isPremium;
export const selectSubscriptionInfo = (state: PremiumState) => state.subscriptionInfo;
export const selectMonthlyPackage = (state: PremiumState) => state.monthlyPackage;
export const selectYearlyPackage = (state: PremiumState) => state.yearlyPackage;
export const selectIsLoading = (state: PremiumState) => state.isLoading;
export const selectIsPurchasing = (state: PremiumState) => state.isPurchasing;
export const selectIsRestoring = (state: PremiumState) => state.isRestoring;
export const selectError = (state: PremiumState) => state.error;