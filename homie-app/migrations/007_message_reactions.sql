-- Migration: Message Reactions
-- Date: 2025-10-31
-- Description: Add reactions to chat messages (like messenger apps)

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One reaction per member per message
  CONSTRAINT message_reactions_unique UNIQUE(message_id, member_id, emoji)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_member_id ON message_reactions(member_id);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy: Users can view reactions in their household messages
CREATE POLICY "Users can view household message reactions"
  ON message_reactions
  FOR SELECT
  USING (
    message_id IN (
      SELECT m.id FROM messages m
      WHERE m.household_id IN (
        SELECT household_id FROM members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Members can add reactions to household messages
CREATE POLICY "Members can add reactions"
  ON message_reactions
  FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT m.id FROM messages m
      WHERE m.household_id IN (
        SELECT household_id FROM members
        WHERE user_id = auth.uid()
      )
    )
    AND member_id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Members can delete their own reactions
CREATE POLICY "Members can delete own reactions"
  ON message_reactions
  FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Function to toggle reaction (add if not exists, remove if exists)
CREATE OR REPLACE FUNCTION toggle_message_reaction(
  message_uuid UUID,
  reaction_emoji TEXT
)
RETURNS TABLE (
  action TEXT,
  reaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_uuid UUID;
  existing_reaction UUID;
  new_reaction UUID;
BEGIN
  -- Get member ID for current user
  SELECT id INTO member_uuid
  FROM members
  WHERE user_id = auth.uid()
  AND household_id = (
    SELECT household_id FROM messages WHERE id = message_uuid
  )
  LIMIT 1;

  IF member_uuid IS NULL THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  -- Check if reaction already exists
  SELECT id INTO existing_reaction
  FROM message_reactions
  WHERE message_id = message_uuid
  AND member_id = member_uuid
  AND emoji = reaction_emoji;

  IF existing_reaction IS NOT NULL THEN
    -- Remove reaction
    DELETE FROM message_reactions
    WHERE id = existing_reaction;

    RETURN QUERY SELECT 'removed'::TEXT, existing_reaction;
  ELSE
    -- Add reaction
    INSERT INTO message_reactions (message_id, member_id, emoji)
    VALUES (message_uuid, member_uuid, reaction_emoji)
    RETURNING id INTO new_reaction;

    RETURN QUERY SELECT 'added'::TEXT, new_reaction;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_message_reaction(UUID, TEXT) TO authenticated;

-- Function to get reaction summary for a message
CREATE OR REPLACE FUNCTION get_message_reactions(message_uuid UUID)
RETURNS TABLE (
  emoji TEXT,
  count BIGINT,
  member_ids UUID[],
  member_names TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.emoji,
    COUNT(*)::BIGINT as count,
    ARRAY_AGG(mr.member_id) as member_ids,
    ARRAY_AGG(m.name) as member_names
  FROM message_reactions mr
  JOIN members m ON mr.member_id = m.id
  WHERE mr.message_id = message_uuid
  GROUP BY mr.emoji
  ORDER BY COUNT(*) DESC, mr.emoji;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_message_reactions(UUID) TO authenticated;

-- Add comments
COMMENT ON TABLE message_reactions IS 'Emoji reactions to chat messages';
COMMENT ON FUNCTION toggle_message_reaction IS 'Add or remove reaction to message (toggle)';
COMMENT ON FUNCTION get_message_reactions IS 'Get aggregated reactions for a message';

-- Create view for messages with reactions count (optional, for performance)
CREATE OR REPLACE VIEW messages_with_reactions AS
SELECT
  m.*,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'emoji', emoji,
          'count', count,
          'member_ids', member_ids,
          'member_names', member_names
        )
      )
      FROM get_message_reactions(m.id)
    ),
    '[]'::json
  ) as reactions
FROM messages m;

-- Grant select on view
GRANT SELECT ON messages_with_reactions TO authenticated;
