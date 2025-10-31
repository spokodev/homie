-- Migration: Advanced Chat Channels System
-- Date: 2025-10-31
-- Description: Add support for multiple chat channels (DMs, groups, private notes)

-- Create chat_channels table
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT, -- Custom name (optional)
  type TEXT NOT NULL CHECK (type IN ('general', 'direct', 'group', 'private')),
  icon TEXT DEFAULT '💬',
  description TEXT,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT false, -- For main household channel
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_channel_members junction table (for group channels)
CREATE TABLE IF NOT EXISTS chat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,

  CONSTRAINT chat_channel_members_unique UNIQUE(channel_id, member_id)
);

-- Add channel_id to messages table (nullable for backwards compatibility)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_channels_household_id ON chat_channels(household_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON chat_channels(type);
CREATE INDEX IF NOT EXISTS idx_chat_channels_created_by ON chat_channels(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_channel_members_channel_id ON chat_channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_channel_members_member_id ON chat_channel_members(member_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);

-- Ensure only one default channel per household
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_channels_household_default
  ON chat_channels(household_id)
  WHERE is_default = true;

-- Add updated_at trigger
CREATE TRIGGER update_chat_channels_updated_at
  BEFORE UPDATE ON chat_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;

-- ===== CHAT CHANNELS RLS POLICIES =====

-- Policy: Users can view channels they're members of
CREATE POLICY "Users can view their channels"
  ON chat_channels
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
    AND (
      -- Default/general channels visible to all
      type IN ('general') OR is_default = true
      -- Or user is a member of the channel
      OR id IN (
        SELECT channel_id FROM chat_channel_members ccm
        JOIN members m ON ccm.member_id = m.id
        WHERE m.user_id = auth.uid()
      )
    )
  );

-- Policy: Members can create channels
CREATE POLICY "Members can create channels"
  ON chat_channels
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
    AND created_by IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Policy: Channel creator or admin can update channel
CREATE POLICY "Creator or admin can update channel"
  ON chat_channels
  FOR UPDATE
  USING (
    created_by IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
    OR household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Channel creator or admin can delete channel (except default)
CREATE POLICY "Creator or admin can delete channel"
  ON chat_channels
  FOR DELETE
  USING (
    is_default = false
    AND (
      created_by IN (
        SELECT id FROM members WHERE user_id = auth.uid()
      )
      OR household_id IN (
        SELECT household_id FROM members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ===== CHAT CHANNEL MEMBERS RLS POLICIES =====

-- Policy: Users can view channel memberships
CREATE POLICY "Users can view channel members"
  ON chat_channel_members
  FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM chat_channels
      WHERE household_id IN (
        SELECT household_id FROM members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can join channels (insert themselves)
CREATE POLICY "Users can join channels"
  ON chat_channel_members
  FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
    AND channel_id IN (
      SELECT id FROM chat_channels
      WHERE household_id IN (
        SELECT household_id FROM members WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can update their own membership (mute, last_read)
CREATE POLICY "Users can update own membership"
  ON chat_channel_members
  FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can leave channels
CREATE POLICY "Users can leave channels"
  ON chat_channel_members
  FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Update messages RLS to support channels
DROP POLICY IF EXISTS "Users can view household messages" ON messages;
CREATE POLICY "Users can view household or channel messages"
  ON messages
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
    AND (
      -- Legacy: messages without channel (household-wide)
      channel_id IS NULL
      -- Or user is member of the channel
      OR channel_id IN (
        SELECT ccm.channel_id FROM chat_channel_members ccm
        JOIN members m ON ccm.member_id = m.id
        WHERE m.user_id = auth.uid()
      )
      -- Or channel is general/default
      OR channel_id IN (
        SELECT id FROM chat_channels
        WHERE type = 'general' OR is_default = true
      )
    )
  );

-- ===== HELPER FUNCTIONS =====

-- Function to create default channel for household
CREATE OR REPLACE FUNCTION create_default_channel_for_household()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create default general channel
  INSERT INTO chat_channels (
    household_id,
    name,
    type,
    icon,
    description,
    is_default
  ) VALUES (
    NEW.id,
    'General',
    'general',
    '💬',
    'Main household chat',
    true
  );

  RETURN NEW;
END;
$$;

-- Trigger to create default channel on household creation
CREATE TRIGGER create_default_channel_on_household
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION create_default_channel_for_household();

-- Function to create direct message channel
CREATE OR REPLACE FUNCTION create_direct_channel(
  other_member_uuid UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_member_uuid UUID;
  current_household_uuid UUID;
  new_channel_id UUID;
  existing_channel_id UUID;
BEGIN
  -- Get current member
  SELECT id, household_id INTO current_member_uuid, current_household_uuid
  FROM members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF current_member_uuid IS NULL THEN
    RAISE EXCEPTION 'Not a member of any household';
  END IF;

  -- Check if DM already exists
  SELECT c.id INTO existing_channel_id
  FROM chat_channels c
  WHERE c.type = 'direct'
  AND c.household_id = current_household_uuid
  AND EXISTS (
    SELECT 1 FROM chat_channel_members
    WHERE channel_id = c.id AND member_id = current_member_uuid
  )
  AND EXISTS (
    SELECT 1 FROM chat_channel_members
    WHERE channel_id = c.id AND member_id = other_member_uuid
  )
  AND (SELECT COUNT(*) FROM chat_channel_members WHERE channel_id = c.id) = 2;

  IF existing_channel_id IS NOT NULL THEN
    RETURN existing_channel_id;
  END IF;

  -- Create new DM channel
  INSERT INTO chat_channels (
    household_id,
    type,
    icon,
    created_by
  ) VALUES (
    current_household_uuid,
    'direct',
    '💬',
    current_member_uuid
  )
  RETURNING id INTO new_channel_id;

  -- Add both members
  INSERT INTO chat_channel_members (channel_id, member_id)
  VALUES
    (new_channel_id, current_member_uuid),
    (new_channel_id, other_member_uuid);

  RETURN new_channel_id;
END;
$$;

-- Function to create group channel
CREATE OR REPLACE FUNCTION create_group_channel(
  channel_name TEXT,
  channel_icon TEXT DEFAULT '👥',
  member_uuids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_member_uuid UUID;
  current_household_uuid UUID;
  new_channel_id UUID;
  member_uuid UUID;
BEGIN
  -- Get current member
  SELECT id, household_id INTO current_member_uuid, current_household_uuid
  FROM members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF current_member_uuid IS NULL THEN
    RAISE EXCEPTION 'Not a member of any household';
  END IF;

  -- Create group channel
  INSERT INTO chat_channels (
    household_id,
    name,
    type,
    icon,
    created_by
  ) VALUES (
    current_household_uuid,
    channel_name,
    'group',
    channel_icon,
    current_member_uuid
  )
  RETURNING id INTO new_channel_id;

  -- Add creator
  INSERT INTO chat_channel_members (channel_id, member_id)
  VALUES (new_channel_id, current_member_uuid);

  -- Add other members
  FOREACH member_uuid IN ARRAY member_uuids
  LOOP
    INSERT INTO chat_channel_members (channel_id, member_id)
    VALUES (new_channel_id, member_uuid)
    ON CONFLICT (channel_id, member_id) DO NOTHING;
  END LOOP;

  RETURN new_channel_id;
END;
$$;

-- Function to create private notes channel
CREATE OR REPLACE FUNCTION create_private_notes_channel()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_member_uuid UUID;
  current_household_uuid UUID;
  new_channel_id UUID;
  existing_channel_id UUID;
BEGIN
  -- Get current member
  SELECT id, household_id INTO current_member_uuid, current_household_uuid
  FROM members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF current_member_uuid IS NULL THEN
    RAISE EXCEPTION 'Not a member of any household';
  END IF;

  -- Check if private channel already exists
  SELECT c.id INTO existing_channel_id
  FROM chat_channels c
  JOIN chat_channel_members ccm ON c.id = ccm.channel_id
  WHERE c.type = 'private'
  AND c.household_id = current_household_uuid
  AND ccm.member_id = current_member_uuid
  AND (SELECT COUNT(*) FROM chat_channel_members WHERE channel_id = c.id) = 1;

  IF existing_channel_id IS NOT NULL THEN
    RETURN existing_channel_id;
  END IF;

  -- Create private notes channel
  INSERT INTO chat_channels (
    household_id,
    name,
    type,
    icon,
    created_by
  ) VALUES (
    current_household_uuid,
    'My Notes',
    'private',
    '📝',
    current_member_uuid
  )
  RETURNING id INTO new_channel_id;

  -- Add only the creator
  INSERT INTO chat_channel_members (channel_id, member_id)
  VALUES (new_channel_id, current_member_uuid);

  RETURN new_channel_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_direct_channel(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_group_channel(TEXT, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_private_notes_channel() TO authenticated;

-- Add comments
COMMENT ON TABLE chat_channels IS 'Chat channels (general, DM, group, private notes)';
COMMENT ON TABLE chat_channel_members IS 'Members in each chat channel';
COMMENT ON COLUMN chat_channels.type IS 'general=household-wide, direct=DM, group=custom group, private=personal notes';
COMMENT ON FUNCTION create_direct_channel IS 'Create or get existing DM channel with another member';
COMMENT ON FUNCTION create_group_channel IS 'Create a group chat with custom name and members';
COMMENT ON FUNCTION create_private_notes_channel IS 'Create or get existing private notes channel';
