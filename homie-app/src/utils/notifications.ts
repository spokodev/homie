import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { trackEvent, ANALYTICS_EVENTS } from './analytics';

/**
 * Configure notification behavior when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'task_assigned' | 'task_completed' | 'captain_rotation' | 'message' | 'rating_request';
  taskId?: string;
  messageId?: string;
  householdId?: string;
  senderId?: string;
  [key: string]: any;
}

/**
 * Register for push notifications and get token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  // Check if physical device
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return undefined;
  }

  try {
    // Get existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Check if permission granted
    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      trackEvent(ANALYTICS_EVENTS.NOTIFICATION_PERMISSION_DENIED, {});
      return undefined;
    }

    // Get push token
    token = (await Notifications.getExpoPushTokenAsync()).data;

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // Create separate channels for different notification types
      await Notifications.setNotificationChannelAsync('tasks', {
        name: 'Tasks',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        description: 'Notifications about task assignments and completions',
      });

      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        description: 'Household chat messages',
      });

      await Notifications.setNotificationChannelAsync('captain', {
        name: 'Captain',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        description: 'Captain rotation and rating reminders',
      });
    }

    trackEvent(ANALYTICS_EVENTS.NOTIFICATION_PERMISSION_GRANTED, { token });
    console.log('Push notification token:', token);
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return undefined;
  }
}

/**
 * Save push token to user's member profile
 */
export async function savePushTokenToDatabase(
  memberId: string,
  pushToken: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('members')
      .update({ push_token: pushToken })
      .eq('id', memberId);

    if (error) throw error;
    console.log('Push token saved to database');
  } catch (error) {
    console.error('Error saving push token:', error);
    throw error;
  }
}

/**
 * Remove push token from database (on logout or disable)
 */
export async function removePushTokenFromDatabase(memberId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('members')
      .update({ push_token: null })
      .eq('id', memberId);

    if (error) throw error;
    console.log('Push token removed from database');
  } catch (error) {
    console.error('Error removing push token:', error);
    throw error;
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: NotificationData,
  seconds: number = 0
): Promise<string> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: seconds === 0 ? null : { seconds },
    });
    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await setBadgeCount(0);
}

/**
 * Dismiss a notification by ID
 */
export async function dismissNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error dismissing notification:', error);
  }
}

/**
 * Dismiss all notifications
 */
export async function dismissAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error dismissing all notifications:', error);
  }
}

/**
 * Get all presented notifications
 */
export async function getPresentedNotifications(): Promise<Notifications.Notification[]> {
  try {
    return await Notifications.getPresentedNotificationsAsync();
  } catch (error) {
    console.error('Error getting presented notifications:', error);
    return [];
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted;
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}
