-- Migration: Push Notifications System
-- Date: 2025-10-31
-- Description: Tables and triggers for push notifications

-- Table for storing push tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT push_tokens_member_unique UNIQUE(member_id)
);

-- Table for notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  task_assigned BOOLEAN DEFAULT true,
  task_completed BOOLEAN DEFAULT true,
  task_due_soon BOOLEAN DEFAULT true,
  new_message BOOLEAN DEFAULT true,
  captain_rotation BOOLEAN DEFAULT true,
  rating_request BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT notification_preferences_member_unique UNIQUE(member_id)
);

-- Table for notification history
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_completed', 'task_due_soon', 'message', 'captain_rotation', 'rating_request')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  delivered BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_member_id ON push_tokens(member_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_member_id ON notification_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_household_id ON notifications(household_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);

-- RLS Policies for push_tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push tokens"
  ON push_tokens FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notifications (mark as read)"
  ON notifications FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Function to create default notification preferences for new members
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (member_id)
  VALUES (NEW.id)
  ON CONFLICT (member_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when member is created
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON members;
CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Function to send push notification (to be called by triggers)
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
    p_data,
    v_push_token IS NOT NULL
  )
  RETURNING id INTO v_notification_id;

  -- TODO: Call external service to actually send push notification
  -- This would typically be done via Supabase Edge Function or webhook
  -- For now, we just store the notification in the database

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for task assignment notifications
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_assigner_name TEXT;
BEGIN
  -- Only send notification if assignee changed and is not null
  IF NEW.assignee_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) THEN
    -- Get task title
    v_task_title := NEW.title;

    -- Get assigner name (creator of the task)
    SELECT name INTO v_assigner_name
    FROM members
    WHERE id = NEW.created_by;

    -- Send notification
    PERFORM send_push_notification(
      NEW.assignee_id,
      NEW.household_id,
      'task_assigned',
      'New Task Assigned',
      COALESCE(v_assigner_name, 'Someone') || ' assigned you: ' || v_task_title,
      jsonb_build_object(
        'taskId', NEW.id,
        'householdId', NEW.household_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task assignments
DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
CREATE TRIGGER task_assigned_notification
  AFTER INSERT OR UPDATE OF assignee_id ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- Trigger function for task completion notifications
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_completer_name TEXT;
  v_household_members UUID[];
BEGIN
  -- Only send notification when task is completed (status changes to completed)
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
    v_task_title := NEW.title;

    -- Get completer name
    SELECT name INTO v_completer_name
    FROM members
    WHERE id = NEW.completed_by;

    -- Get all household members except the one who completed it
    SELECT array_agg(id) INTO v_household_members
    FROM members
    WHERE household_id = NEW.household_id
      AND id != NEW.completed_by;

    -- Send notification to all household members
    IF v_household_members IS NOT NULL THEN
      FOR i IN 1..array_length(v_household_members, 1) LOOP
        PERFORM send_push_notification(
          v_household_members[i],
          NEW.household_id,
          'task_completed',
          'Task Completed',
          COALESCE(v_completer_name, 'Someone') || ' completed: ' || v_task_title,
          jsonb_build_object(
            'taskId', NEW.id,
            'householdId', NEW.household_id
          )
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task completions
DROP TRIGGER IF EXISTS task_completed_notification ON tasks;
CREATE TRIGGER task_completed_notification
  AFTER INSERT OR UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();

-- Trigger function for new message notifications
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_message_preview TEXT;
  v_household_members UUID[];
BEGIN
  -- Only for non-system messages
  IF NEW.type != 'system' THEN
    -- Get sender name
    SELECT name INTO v_sender_name
    FROM members
    WHERE id = NEW.member_id;

    -- Create message preview (first 50 chars)
    v_message_preview := substring(NEW.content, 1, 50);
    IF length(NEW.content) > 50 THEN
      v_message_preview := v_message_preview || '...';
    END IF;

    -- Get all household members except the sender
    SELECT array_agg(id) INTO v_household_members
    FROM members
    WHERE household_id = NEW.household_id
      AND id != NEW.member_id;

    -- Send notification to all household members
    IF v_household_members IS NOT NULL THEN
      FOR i IN 1..array_length(v_household_members, 1) LOOP
        PERFORM send_push_notification(
          v_household_members[i],
          NEW.household_id,
          'message',
          COALESCE(v_sender_name, 'Someone') || ' sent a message',
          v_message_preview,
          jsonb_build_object(
            'messageId', NEW.id,
            'householdId', NEW.household_id,
            'channelId', NEW.channel_id
          )
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new messages
DROP TRIGGER IF EXISTS new_message_notification ON messages;
CREATE TRIGGER new_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_push_notification(UUID, UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_notification_preferences() TO authenticated;
