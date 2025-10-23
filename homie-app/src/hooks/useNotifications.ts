import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '@/stores/app.store';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useRouter } from 'expo-router';
import {
  registerForPushNotificationsAsync,
  savePushTokenToDatabase,
  removePushTokenFromDatabase,
  NotificationData,
} from '@/utils/notifications';
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

export function useNotifications() {
  const router = useRouter();
  const { member } = useHousehold();
  const { notificationsEnabled, setPushToken } = useAppStore();
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Register for push notifications
  useEffect(() => {
    if (notificationsEnabled && member?.id) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          setExpoPushToken(token);
          setPushToken(token);

          // Save to database
          savePushTokenToDatabase(member.id, token).catch((error) => {
            console.error('Failed to save push token:', error);
          });
        }
      });
    } else if (!notificationsEnabled && member?.id && expoPushToken) {
      // Remove token from database if notifications disabled
      removePushTokenFromDatabase(member.id).catch((error) => {
        console.error('Failed to remove push token:', error);
      });
    }
  }, [notificationsEnabled, member?.id]);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);

      trackEvent(ANALYTICS_EVENTS.NOTIFICATION_RECEIVED, {
        type: notification.request.content.data?.type,
        foreground: true,
      });
    });

    // Listener for notification taps (user interaction)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;

      trackEvent(ANALYTICS_EVENTS.NOTIFICATION_OPENED, {
        type: data.type,
      });

      // Navigate based on notification type
      handleNotificationNavigation(data);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Handle navigation based on notification data
  const handleNotificationNavigation = (data: NotificationData) => {
    if (!data) return;

    try {
      switch (data.type) {
        case 'task_assigned':
        case 'task_completed':
          if (data.taskId) {
            router.push(`/(modals)/task-details?id=${data.taskId}`);
          }
          break;

        case 'message':
          router.push('/(tabs)/chat');
          break;

        case 'captain_rotation':
          router.push('/(tabs)/home');
          break;

        case 'rating_request':
          if (data.householdId) {
            router.push('/(modals)/rate-captain');
          }
          break;

        default:
          // Navigate to home for unknown types
          router.push('/(tabs)/home');
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
  };

  // Enable notifications
  const enableNotifications = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token && member?.id) {
      setExpoPushToken(token);
      setPushToken(token);
      await savePushTokenToDatabase(member.id, token);

      trackEvent(ANALYTICS_EVENTS.NOTIFICATIONS_TOGGLED, {
        enabled: true,
      });
    }
  };

  // Disable notifications
  const disableNotifications = async () => {
    if (member?.id) {
      await removePushTokenFromDatabase(member.id);

      trackEvent(ANALYTICS_EVENTS.NOTIFICATIONS_TOGGLED, {
        enabled: false,
      });
    }
  };

  return {
    expoPushToken,
    notification,
    enableNotifications,
    disableNotifications,
  };
}

/**
 * Hook to get all notifications from the notification center
 */
export function useNotificationHistory() {
  const [notifications, setNotifications] = useState<Notifications.Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const presented = await Notifications.getPresentedNotificationsAsync();
      setNotifications(presented);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const dismissNotification = async (notificationId: string) => {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
      setNotifications((prev) => prev.filter((n) => n.request.identifier !== notificationId));

      trackEvent(ANALYTICS_EVENTS.NOTIFICATION_DISMISSED, {
        notification_id: notificationId,
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const dismissAll = async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
      setNotifications([]);

      trackEvent(ANALYTICS_EVENTS.NOTIFICATION_DISMISSED, {
        all: true,
      });
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  };

  const refresh = () => {
    fetchNotifications();
  };

  return {
    notifications,
    loading,
    dismissNotification,
    dismissAll,
    refresh,
  };
}
