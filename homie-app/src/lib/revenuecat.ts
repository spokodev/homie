// RevenueCat SDK integration
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesStoreProduct,
  LOG_LEVEL,
  PurchasesError,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// Note: PurchasesProduct is now PurchasesStoreProduct in v9+
type PurchasesProduct = PurchasesStoreProduct;

// Product identifiers
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
} as const;

// Entitlement identifier
export const ENTITLEMENT_ID = 'premium';

class RevenueCatService {
  private isConfigured = false;

  /**
   * Initialize RevenueCat SDK
   */
  async configure(): Promise<void> {
    if (this.isConfigured) return;

    try {
      // Check if running in Expo Go
      const isExpoGo = !!(global as any).expo;

      let apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
      });

      // Use test store API key for Expo Go
      if (isExpoGo && __DEV__) {
        // For Expo Go, we need to use a test store configuration
        // This is a limitation of Expo Go as it doesn't have access to native store
        console.log('Running in Expo Go - RevenueCat will have limited functionality');
        // Skip RevenueCat initialization in Expo Go to avoid errors
        this.isConfigured = true;
        return;
      }

      if (!apiKey) {
        console.warn('RevenueCat API key not found. Subscriptions will not work.');
        return;
      }

      // Configure RevenueCat with v9+ API
      Purchases.configure({ apiKey });

      // Set log level for debugging
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      this.isConfigured = true;
      console.log('RevenueCat configured successfully');
    } catch (error) {
      console.error('Failed to configure RevenueCat:', error);
      // Mark as configured to prevent retry loops
      this.isConfigured = true;
    }
  }

  /**
   * Login user to RevenueCat
   */
  async login(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log('User logged in to RevenueCat:', userId);
    } catch (error) {
      console.error('Failed to login to RevenueCat:', error);
    }
  }

  /**
   * Logout from RevenueCat
   */
  async logout(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log('User logged out from RevenueCat');
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    // Return null if running in Expo Go
    if (!this.isConfigured || (!!(global as any).expo && __DEV__)) {
      return null;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Check if user has active premium subscription
   */
  async isPremium(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;

      // Check if user has the premium entitlement
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      return entitlement !== undefined && entitlement.isActive;
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }

  /**
   * Get available offerings
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    // Return null if running in Expo Go
    if (!this.isConfigured || (!!(global as any).expo && __DEV__)) {
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  /**
   * Get available packages
   */
  async getPackages(): Promise<PurchasesPackage[]> {
    try {
      const offerings = await this.getOfferings();
      if (!offerings) return [];
      return offerings.availablePackages;
    } catch (error) {
      console.error('Failed to get packages:', error);
      return [];
    }
  }

  /**
   * Purchase a package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

      // Check if purchase was successful
      const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      return {
        success: isPremium,
        customerInfo,
      };
    } catch (error) {
      const purchaseError = error as PurchasesError;

      // Check if user cancelled
      if (purchaseError.userCancelled) {
        return {
          success: false,
          error: 'Purchase cancelled',
        };
      }

      console.error('Purchase failed:', error);
      return {
        success: false,
        error: purchaseError.message || 'Purchase failed',
      };
    }
  }

  /**
   * Purchase a product by ID
   */
  async purchaseProduct(productId: string): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      const packages = await this.getPackages();
      const packageToPurchase = packages.find(
        (pkg) => pkg.product.identifier === productId
      );

      if (!packageToPurchase) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      return await this.purchasePackage(packageToPurchase);
    } catch (error) {
      console.error('Failed to purchase product:', error);
      return {
        success: false,
        error: 'Purchase failed',
      };
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<{
    success: boolean;
    customerInfo?: CustomerInfo;
    error?: string;
  }> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      return {
        success: isPremium,
        customerInfo,
      };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return {
        success: false,
        error: 'Restore failed',
      };
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<PurchasesProduct | null> {
    try {
      const packages = await this.getPackages();
      const pkg = packages.find((p) => p.product.identifier === productId);
      return pkg?.product || null;
    } catch (error) {
      console.error('Failed to get product:', error);
      return null;
    }
  }

  /**
   * Format price for display
   */
  formatPrice(product: PurchasesProduct): string {
    return product.priceString;
  }

  /**
   * Check if user can make payments
   */
  async canMakePayments(): Promise<boolean> {
    try {
      return await Purchases.canMakePayments();
    } catch (error) {
      console.error('Failed to check payment availability:', error);
      return false;
    }
  }

  /**
   * Set user attributes for segmentation
   */
  async setUserAttributes(attributes: Record<string, string>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(attributes)) {
        await Purchases.setAttributes({ [key]: value });
      }
    } catch (error) {
      console.error('Failed to set user attributes:', error);
    }
  }

  /**
   * Get subscription status details
   */
  async getSubscriptionStatus(): Promise<{
    isActive: boolean;
    expirationDate?: string;
    willRenew?: boolean;
    productId?: string;
    isTrial?: boolean;
  }> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) {
        return { isActive: false };
      }

      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (!entitlement) {
        return { isActive: false };
      }

      return {
        isActive: entitlement.isActive,
        expirationDate: entitlement.expirationDate || undefined,
        willRenew: entitlement.willRenew,
        productId: entitlement.productIdentifier,
        isTrial: entitlement.periodType === 'TRIAL',
      };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { isActive: false };
    }
  }
}

// Export singleton instance
export const revenueCat = new RevenueCatService();

// Export mock types for convenience (Expo Go compatible)
export type { CustomerInfo, PurchasesPackage, PurchasesProduct };