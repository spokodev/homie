-- Migration: Add support for message editing and replying
-- Date: 2025-10-31
-- Description: Adds edited_at and reply_to_id fields to messages table

-- Add edited_at field for tracking message edits
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Add reply_to_id field for message threading
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Create index for reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);

-- Add comment explaining the fields
COMMENT ON COLUMN messages.edited_at IS 'Timestamp when message was last edited';
COMMENT ON COLUMN messages.reply_to_id IS 'Reference to message being replied to for threading';

-- Update RLS policies to allow updates for message editing
-- Only allow users to edit their own messages within the same household
CREATE POLICY "Users can update own messages in household"
  ON messages
  FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
      AND household_id = messages.household_id
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
      AND household_id = messages.household_id
    )
  );

-- Create function to get replied message context
CREATE OR REPLACE FUNCTION get_reply_context(message_uuid UUID)
RETURNS TABLE (
  reply_id UUID,
  reply_content TEXT,
  reply_member_name TEXT,
  reply_member_avatar TEXT,
  reply_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id as reply_id,
    m.content as reply_content,
    mem.name as reply_member_name,
    mem.avatar as reply_member_avatar,
    m.created_at as reply_created_at
  FROM messages m
  JOIN members mem ON m.member_id = mem.id
  WHERE m.id = (
    SELECT reply_to_id
    FROM messages
    WHERE id = message_uuid
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_reply_context(UUID) TO authenticated;
