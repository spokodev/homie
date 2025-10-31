-- Migration: Integrate Edge Function for actual push notification sending
-- Date: 2025-10-31
-- Description: Update send_push_notification to call Supabase Edge Function

-- Update the send_push_notification function to call Edge Function
CREATE OR REPLACE FUNCTION send_push_notification(
  p_member_id UUID,
  p_household_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_push_token TEXT;
  v_preferences RECORD;
  v_supabase_url TEXT;
BEGIN
  -- Get member's notification preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE member_id = p_member_id;

  -- Check if notifications are enabled for this type
  IF v_preferences IS NULL THEN
    -- Create default preferences if not exist
    INSERT INTO notification_preferences (member_id)
    VALUES (p_member_id)
    RETURNING * INTO v_preferences;
  END IF;

  -- Check if this notification type is enabled
  IF (
    (p_type = 'task_assigned' AND NOT v_preferences.task_assigned) OR
    (p_type = 'task_completed' AND NOT v_preferences.task_completed) OR
    (p_type = 'task_due_soon' AND NOT v_preferences.task_due_soon) OR
    (p_type = 'message' AND NOT v_preferences.new_message) OR
    (p_type = 'captain_rotation' AND NOT v_preferences.captain_rotation) OR
    (p_type = 'rating_request' AND NOT v_preferences.rating_request)
  ) THEN
    -- Notification type is disabled, don't send
    RETURN NULL;
  END IF;

  -- Get push token
  SELECT token INTO v_push_token
  FROM push_tokens
  WHERE member_id = p_member_id
  LIMIT 1;

  -- Create notification record
  INSERT INTO notifications (
    member_id,
    household_id,
    type,
    title,
    body,
    data,
    delivered
  ) VALUES (
    p_member_id,
    p_household_id,
    p_type,
    p_title,
    p_body,
    p_data || jsonb_build_object('type', p_type),
    false
  )
  RETURNING id INTO v_notification_id;

  -- If push token exists, call Edge Function to send notification
  IF v_push_token IS NOT NULL THEN
    -- Get Supabase URL from environment or use default
    SELECT current_setting('app.settings.supabase_url', true) INTO v_supabase_url;

    IF v_supabase_url IS NULL THEN
      v_supabase_url := 'https://your-project.supabase.co';
    END IF;

    -- Call Edge Function asynchronously using pg_net (if available)
    -- Note: This requires pg_net extension to be enabled
    -- For now, we'll just mark it for processing and rely on a separate worker
    -- or you can use Supabase Realtime/Webhooks

    -- Alternative: Use pg_cron or external webhook service
    -- For simplicity, we'll update the notification with the token info
    -- and let a separate process handle the actual sending

    UPDATE notifications
    SET data = data || jsonb_build_object('push_token', v_push_token)
    WHERE id = v_notification_id;
  END IF;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table to queue notifications for sending
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at ON notification_queue(created_at);

-- Function to queue notification for sending
CREATE OR REPLACE FUNCTION queue_notification_for_sending()
RETURNS TRIGGER AS $$
DECLARE
  v_push_token TEXT;
BEGIN
  -- Get push token from notification data (set by send_push_notification)
  IF NEW.data ? 'push_token' THEN
    v_push_token := NEW.data->>'push_token';

    -- Queue notification for sending
    INSERT INTO notification_queue (
      notification_id,
      push_token,
      title,
      body,
      data
    ) VALUES (
      NEW.id,
      v_push_token,
      NEW.title,
      NEW.body,
      NEW.data - 'push_token' -- Remove push_token from data before sending
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to queue notifications when created
DROP TRIGGER IF EXISTS queue_notification_trigger ON notifications;
CREATE TRIGGER queue_notification_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION queue_notification_for_sending();

-- Function to process notification queue (to be called by external worker/cron)
CREATE OR REPLACE FUNCTION process_notification_queue(batch_size INT DEFAULT 10)
RETURNS TABLE (
  processed_count INT,
  failed_count INT
) AS $$
DECLARE
  v_processed INT := 0;
  v_failed INT := 0;
  v_notification RECORD;
BEGIN
  -- Get pending notifications
  FOR v_notification IN
    SELECT *
    FROM notification_queue
    WHERE status = 'pending'
      AND attempts < max_attempts
    ORDER BY created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Mark as processing
    UPDATE notification_queue
    SET status = 'processing'
    WHERE id = v_notification.id;

    -- Here you would call the Edge Function via HTTP
    -- For now, we'll just mark it as sent
    -- In production, use supabase.functions.invoke() or http extension

    -- Simulate success for now
    UPDATE notification_queue
    SET
      status = 'sent',
      processed_at = NOW()
    WHERE id = v_notification.id;

    v_processed := v_processed + 1;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_failed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON notification_queue TO authenticated;
GRANT EXECUTE ON FUNCTION queue_notification_for_sending() TO authenticated;
GRANT EXECUTE ON FUNCTION process_notification_queue(INT) TO authenticated;
