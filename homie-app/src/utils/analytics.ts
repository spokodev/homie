import posthog from 'posthog-react-native';

// Analytics event names
export const ANALYTICS_EVENTS = {
  // Auth Events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Task Events
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  TASK_COMPLETED: 'task_completed',
  TASK_ASSIGNED: 'task_assigned',

  // Chat Events
  MESSAGE_SENT: 'message_sent',

  // Room Events
  ROOM_CREATED: 'room_created',
  ROOM_DELETED: 'room_deleted',
  NOTE_CREATED: 'note_created',
  NOTE_DELETED: 'note_deleted',
  NOTE_PINNED: 'note_pinned',

  // Profile Events
  PROFILE_UPDATED: 'profile_updated',
  AVATAR_CHANGED: 'avatar_changed',

  // Premium Events
  PREMIUM_PURCHASE: 'premium_purchase',
  PREMIUM_CANCEL: 'premium_cancel',
  SUBSCRIPTION_VIEWED: 'subscription_viewed',

  // Badge Events
  BADGE_EARNED: 'badge_earned',
  BADGE_VIEWED: 'badge_viewed',

  // Navigation Events
  SCREEN_VIEWED: 'screen_viewed',
  TAB_CHANGED: 'tab_changed',

  // Settings Events
  SETTINGS_OPENED: 'settings_opened',
  NOTIFICATIONS_TOGGLED: 'notifications_toggled',
  THEME_CHANGED: 'theme_changed',

  // Funnel Events
  ONBOARDING_STARTED: 'onboarding_started',
  HOUSEHOLD_CREATED: 'household_created',
  MEMBER_ADDED: 'member_added',
  PREMIUM_UPGRADE_VIEWED: 'premium_upgrade_viewed',
  PREMIUM_UPGRADE_CLICKED: 'premium_upgrade_clicked',
  TASK_ASSIGNMENT_STARTED: 'task_assignment_started',
} as const;

/**
 * Initialize PostHog analytics
 */
export function initializeAnalytics() {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    if (__DEV__) {
      console.log('[Analytics] PostHog API key not found, analytics disabled');
    }
    return;
  }

  try {
    posthog.initAsync(apiKey, {
      host,
      captureApplicationLifecycleEvents: true, // Capture app open, close events
      captureDeepLinks: true, // Capture deep link events
    });

    if (__DEV__) {
      console.log('[Analytics] PostHog initialized successfully');
    }
  } catch (error) {
    console.error('[Analytics] Failed to initialize PostHog:', error);
  }
}

/**
 * Track an analytics event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (__DEV__) {
    console.log('[Analytics] Track event:', eventName, properties);
  }

  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
}

/**
 * Identify a user with their properties
 */
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    household_id?: string;
    household_size?: number;
    premium_status?: boolean;
    level?: number;
    points?: number;
  }
) {
  if (__DEV__) {
    console.log('[Analytics] Identify user:', userId, properties);
  }

  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.error('[Analytics] Failed to identify user:', error);
  }
}

/**
 * Reset user identity (on logout)
 */
export function resetUser() {
  if (__DEV__) {
    console.log('[Analytics] Reset user');
  }

  try {
    posthog.reset();
  } catch (error) {
    console.error('[Analytics] Failed to reset user:', error);
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  if (__DEV__) {
    console.log('[Analytics] Set user properties:', properties);
  }

  try {
    posthog.capture('$set', { $set: properties });
  } catch (error) {
    console.error('[Analytics] Failed to set user properties:', error);
  }
}

/**
 * Track screen view
 */
export function trackScreenView(screenName: string, properties?: Record<string, any>) {
  trackEvent(ANALYTICS_EVENTS.SCREEN_VIEWED, {
    screen_name: screenName,
    ...properties,
  });
}

/**
 * Track task event with common properties
 */
export function trackTaskEvent(
  eventName: string,
  taskData: {
    task_id?: string;
    points?: number;
    status?: string;
    has_assignee?: boolean;
    has_due_date?: boolean;
    estimated_minutes?: number;
  }
) {
  trackEvent(eventName, taskData);
}

/**
 * Track premium event
 */
export function trackPremiumEvent(
  eventName: string,
  data?: {
    plan?: 'monthly' | 'yearly';
    price?: number;
    source?: string;
  }
) {
  trackEvent(eventName, data);
}

/**
 * Track badge event
 */
export function trackBadgeEvent(
  eventName: string,
  badgeData: {
    badge_id: string;
    badge_name: string;
    badge_tier: 'free' | 'premium';
  }
) {
  trackEvent(eventName, badgeData);
}

/**
 * Start a session
 */
export function startSession() {
  trackEvent('session_start');
}

/**
 * End a session
 */
export function endSession() {
  trackEvent('session_end');
}
