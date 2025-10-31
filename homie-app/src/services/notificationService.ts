/**
 * Notification Service
 * Handles processing notification queue and sending via Expo Push API
 * Can be run in background or on-demand
 */

import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';

interface QueuedNotification {
  id: string;
  notification_id: string;
  push_token: string;
  title: string;
  body: string;
  data: any;
  attempts: number;
  max_attempts: number;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Process a batch of queued notifications
 */
export async function processNotificationQueue(batchSize: number = 10): Promise<{
  processed: number;
  failed: number;
}> {
  let processed = 0;
  let failed = 0;

  try {
    // Fetch pending notifications
    const { data: notifications, error } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (error) {
      console.error('Error fetching notification queue:', error);
      return { processed, failed };
    }

    if (!notifications || notifications.length === 0) {
      return { processed, failed };
    }

    // Process each notification
    for (const notification of notifications) {
      try {
        // Mark as processing
        await supabase
          .from('notification_queue')
          .update({ status: 'processing' })
          .eq('id', notification.id);

        // Send via Expo Push API
        const success = await sendExpoPushNotification(
          notification.push_token,
          notification.title,
          notification.body,
          notification.data
        );

        if (success) {
          // Mark as sent
          await supabase
            .from('notification_queue')
            .update({
              status: 'sent',
              processed_at: new Date().toISOString(),
            })
            .eq('id', notification.id);

          // Update notification record
          await supabase
            .from('notifications')
            .update({ delivered: true })
            .eq('id', notification.notification_id);

          processed++;
        } else {
          // Increment attempts
          const newAttempts = notification.attempts + 1;

          if (newAttempts >= notification.max_attempts) {
            // Max attempts reached, mark as failed
            await supabase
              .from('notification_queue')
              .update({
                status: 'failed',
                attempts: newAttempts,
                processed_at: new Date().toISOString(),
                error_message: 'Max attempts reached',
              })
              .eq('id', notification.id);
          } else {
            // Reset to pending for retry
            await supabase
              .from('notification_queue')
              .update({
                status: 'pending',
                attempts: newAttempts,
              })
              .eq('id', notification.id);
          }

          failed++;
        }
      } catch (error) {
        console.error('Error processing notification:', error);

        // Update with error
        await supabase
          .from('notification_queue')
          .update({
            status: 'pending',
            attempts: notification.attempts + 1,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', notification.id);

        failed++;
      }
    }
  } catch (error) {
    console.error('Error in processNotificationQueue:', error);
  }

  return { processed, failed };
}

/**
 * Send push notification via Expo Push API
 */
async function sendExpoPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: any = {}
): Promise<boolean> {
  try {
    // Validate push token format
    if (!pushToken.startsWith('ExponentPushToken[')) {
      console.error('Invalid push token format:', pushToken);
      return false;
    }

    // Determine channel ID
    let channelId = 'default';
    if (data.type) {
      switch (data.type) {
        case 'task_assigned':
        case 'task_completed':
        case 'task_due_soon':
          channelId = 'tasks';
          break;
        case 'message':
          channelId = 'messages';
          break;
        case 'captain_rotation':
        case 'rating_request':
          channelId = 'gamification';
          break;
      }
    }

    // Send to Expo Push API
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
        channelId,
      }),
    });

    const result = await response.json();

    // Check if successful
    if (result.data && result.data[0]) {
      const ticket = result.data[0];

      if (ticket.status === 'ok') {
        console.log('Push notification sent successfully');
        return true;
      } else {
        console.error('Push notification error:', ticket.message, ticket.details);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Schedule local notification (for immediate display)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: any = {},
  seconds: number = 0
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: seconds > 0 ? {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      } : null,
    });

    return id;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    return null;
  }
}

/**
 * Start background notification processing
 * This should be called when app starts
 */
export function startNotificationProcessor() {
  // Process queue every 30 seconds
  const interval = setInterval(async () => {
    const result = await processNotificationQueue(10);
    if (result.processed > 0 || result.failed > 0) {
      console.log(`Notification queue processed: ${result.processed} sent, ${result.failed} failed`);
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}
