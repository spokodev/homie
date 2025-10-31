// Supabase Edge Function to send push notifications via Expo Push API
// This function is called by database triggers when notifications need to be sent

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

interface NotificationPayload {
  notification_id: string;
  member_id: string;
  push_token: string;
  title: string;
  body: string;
  data?: any;
}

interface ExpoPushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data?: any;
  priority: 'high';
  channelId?: string;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const payload: NotificationPayload = await req.json();

    // Validate payload
    if (!payload.push_token || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: push_token, title, body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Determine channel ID based on notification type
    let channelId = 'default';
    if (payload.data?.type) {
      switch (payload.data.type) {
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

    // Prepare Expo push message
    const pushMessage: ExpoPushMessage = {
      to: payload.push_token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      priority: 'high',
      channelId,
    };

    // Send push notification via Expo Push API
    const expoResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(pushMessage),
    });

    const expoResult = await expoResponse.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update notification record with delivery status
    if (expoResult.data && expoResult.data[0]) {
      const ticketData = expoResult.data[0];
      const delivered = ticketData.status === 'ok';

      await supabase
        .from('notifications')
        .update({
          delivered,
          data: {
            ...payload.data,
            expo_ticket: ticketData,
          },
        })
        .eq('id', payload.notification_id);

      // If there's an error, log it
      if (ticketData.status === 'error') {
        console.error('Expo push error:', ticketData.message, ticketData.details);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expo_result: expoResult,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
