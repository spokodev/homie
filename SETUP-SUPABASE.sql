-- Homie Database Setup Script
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/ojmmvaoztddrgvthcjit/sql

-- 1. Create households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '🏠',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(10) DEFAULT '😊',
  type VARCHAR(20) CHECK (type IN ('human', 'pet')) DEFAULT 'human',
  role VARCHAR(20) CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '🏠',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,
  created_by UUID REFERENCES members(id) NOT NULL,
  points INTEGER DEFAULT 10,
  status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create room_notes table
CREATE TABLE IF NOT EXISTS room_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  color VARCHAR(7) DEFAULT '#FFD93D',
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create cleaning_captains table
CREATE TABLE IF NOT EXISTS cleaning_captains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('upcoming', 'current', 'completed')) DEFAULT 'upcoming',
  average_rating DECIMAL(2, 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create captain_ratings table
CREATE TABLE IF NOT EXISTS captain_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_week_id UUID REFERENCES cleaning_captains(id) ON DELETE CASCADE,
  rated_by UUID REFERENCES members(id) ON DELETE CASCADE,
  stars INTEGER CHECK (stars >= 1 AND stars <= 5) NOT NULL,
  feedback TEXT,
  private_note TEXT,
  positive_tags TEXT[] DEFAULT '{}',
  improvement_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('text', 'image', 'system')) DEFAULT 'text',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) NOT NULL,
  tier VARCHAR(20) CHECK (tier IN ('free', 'premium')) DEFAULT 'free',
  requirements JSONB DEFAULT '{}'
);

-- 10. Create member_badges junction table
CREATE TABLE IF NOT EXISTS member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, badge_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_household_id ON members(household_id);
CREATE INDEX IF NOT EXISTS idx_tasks_household_id ON tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_rooms_household_id ON rooms(household_id);
CREATE INDEX IF NOT EXISTS idx_room_notes_room_id ON room_notes(room_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_captains_household_id ON cleaning_captains(household_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_captains_status ON cleaning_captains(status);
CREATE INDEX IF NOT EXISTS idx_messages_household_id ON messages(household_id);
CREATE INDEX IF NOT EXISTS idx_member_badges_member_id ON member_badges(member_id);

-- Enable Row Level Security (RLS)
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE captain_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic examples - adjust based on your needs)
-- Policy for households
CREATE POLICY "Users can view their households" ON households
  FOR SELECT USING (
    id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their households if admin" ON households
  FOR UPDATE USING (
    id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy for members
CREATE POLICY "Users can view members in their household" ON members
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Policy for tasks
CREATE POLICY "Users can view tasks in their household" ON tasks
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their household" ON tasks
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Policy for messages
CREATE POLICY "Users can view messages in their household" ON messages
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their household" ON messages
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Insert default badges
INSERT INTO badges (id, name, description, icon, tier) VALUES
  ('first_task', 'First Task', 'Complete your first task', '🌟', 'free'),
  ('week_streak', 'Week Warrior', '7 day streak', '🔥', 'free'),
  ('home_hero', 'Home Hero', 'Complete 10 tasks', '🏠', 'free'),
  ('pet_pal', 'Pet Pal', 'Complete 5 pet tasks', '🐕', 'free'),
  ('five_star', '5-Star Captain', 'Get 5-star rating', '⭐', 'free'),
  ('speed_demon', 'Speed Demon', 'Beat estimate 10 times', '⚡', 'premium'),
  ('perfectionist', 'Perfectionist', '10 perfect ratings', '💎', 'premium'),
  ('early_bird', 'Early Bird', 'Complete before 9am', '🐦', 'premium'),
  ('night_owl', 'Night Owl', 'Complete after 10pm', '🦉', 'premium'),
  ('marathon', 'Marathon Runner', '50 tasks completed', '🏃', 'premium'),
  ('legendary', 'Legendary', 'Reach level 50', '👑', 'premium'),
  ('team_player', 'Team Player', 'Help others 20 times', '🤝', 'premium')
ON CONFLICT (id) DO NOTHING;

-- Create function for updating member points
CREATE OR REPLACE FUNCTION update_member_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE members
    SET points = points + NEW.points
    WHERE id = NEW.assignee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task completion
DROP TRIGGER IF EXISTS task_completion_trigger ON tasks;
CREATE TRIGGER task_completion_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_member_points();

-- Success message
SELECT 'Database setup completed successfully! 🎉' as message;