-- Migration: Add Categories, Subtasks, Photos, and Flexible Rotation
-- Date: 2025-01-27
-- Description: Implements custom categories, subtasks with points, photo uploads,
--              and flexible rotation from minutes to years

-- 1. Custom categories for each household
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_by UUID REFERENCES members(id),
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, name)
);

-- 2. Subtasks with points
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  points INT DEFAULT 1 CHECK (points > 0 AND points <= 100),
  is_completed BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Task photos (max 3 per task)
CREATE TABLE IF NOT EXISTS task_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES members(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Modify tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES task_categories(id),
  ADD COLUMN IF NOT EXISTS completed_subtask_ids UUID[],
  ADD COLUMN IF NOT EXISTS has_subtasks BOOLEAN DEFAULT FALSE;

-- Remove estimated_minutes as time is no longer needed
ALTER TABLE tasks DROP COLUMN IF EXISTS estimated_minutes;
ALTER TABLE tasks DROP COLUMN IF EXISTS actual_minutes;

-- 5. Modify recurring_tasks for flexible rotation (minute to year)
ALTER TABLE recurring_tasks
  ADD COLUMN IF NOT EXISTS assignee_rotation UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rotation_interval_value INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rotation_interval_unit VARCHAR(10) DEFAULT 'week'
    CHECK (rotation_interval_unit IN ('minute', 'hour', 'day', 'week', 'month', 'year')),
  ADD COLUMN IF NOT EXISTS current_rotation_index INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rotation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manual_override_until TIMESTAMPTZ; -- для ручної зміни

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_categories_household ON task_categories(household_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_photos_task ON task_photos(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);

-- 7. Insert predefined categories for existing households
INSERT INTO task_categories (household_id, name, icon, color, is_custom)
SELECT DISTINCT
  h.id,
  cat.name,
  cat.icon,
  cat.color,
  false
FROM households h
CROSS JOIN (
  VALUES
    ('Cleaning', '🧹', '#10B981'),
    ('Kitchen', '🍳', '#F59E0B'),
    ('Bathroom', '🚿', '#3B82F6'),
    ('Pet Care', '🐕', '#8B5CF6'),
    ('Laundry', '🧺', '#EC4899'),
    ('Outdoor', '🌱', '#14B8A6'),
    ('Maintenance', '🔧', '#6B7280'),
    ('Shopping', '🛒', '#EF4444'),
    ('General', '📋', '#6366F1')
) AS cat(name, icon, color)
WHERE NOT EXISTS (
  SELECT 1 FROM task_categories tc
  WHERE tc.household_id = h.id AND tc.name = cat.name
);

-- 8. Row Level Security Policies

-- Categories: everyone can view, only admins can manage
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view categories" ON task_categories
  FOR SELECT TO authenticated
  USING (household_id IN (
    SELECT household_id FROM members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can create categories" ON task_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories" ON task_categories
  FOR UPDATE TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete custom categories" ON task_categories
  FOR DELETE TO authenticated
  USING (
    is_custom = true AND
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Subtasks: access through tasks
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access subtasks through tasks" ON subtasks
  FOR ALL TO authenticated
  USING (task_id IN (
    SELECT id FROM tasks WHERE household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
  ));

-- Photos: access through tasks
ALTER TABLE task_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access photos through tasks" ON task_photos
  FOR ALL TO authenticated
  USING (task_id IN (
    SELECT id FROM tasks WHERE household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
  ));

-- 9. Functions for rotation logic

-- Function to check if rotation is needed
CREATE OR REPLACE FUNCTION should_rotate_assignee(
  last_rotation TIMESTAMPTZ,
  interval_value INT,
  interval_unit VARCHAR,
  manual_override TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- If manual override is active, don't rotate
  IF manual_override IS NOT NULL AND manual_override > NOW() THEN
    RETURN FALSE;
  END IF;

  -- If never rotated, should rotate
  IF last_rotation IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check based on interval unit
  CASE interval_unit
    WHEN 'minute' THEN
      RETURN (NOW() - last_rotation) >= (interval_value || ' minutes')::INTERVAL;
    WHEN 'hour' THEN
      RETURN (NOW() - last_rotation) >= (interval_value || ' hours')::INTERVAL;
    WHEN 'day' THEN
      RETURN (NOW() - last_rotation) >= (interval_value || ' days')::INTERVAL;
    WHEN 'week' THEN
      RETURN (NOW() - last_rotation) >= (interval_value || ' weeks')::INTERVAL;
    WHEN 'month' THEN
      RETURN (NOW() - last_rotation) >= (interval_value || ' months')::INTERVAL;
    WHEN 'year' THEN
      RETURN (NOW() - last_rotation) >= (interval_value || ' years')::INTERVAL;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get next assignee from rotation
CREATE OR REPLACE FUNCTION get_next_rotation_assignee(
  rotation_list UUID[],
  current_index INT,
  should_rotate BOOLEAN
)
RETURNS UUID AS $$
BEGIN
  -- No rotation list
  IF array_length(rotation_list, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  -- If should rotate, get next index
  IF should_rotate THEN
    RETURN rotation_list[((current_index + 1) % array_length(rotation_list, 1)) + 1];
  ELSE
    -- Return current assignee
    RETURN rotation_list[current_index + 1];
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 10. Update trigger for task points calculation
CREATE OR REPLACE FUNCTION calculate_task_points()
RETURNS TRIGGER AS $$
BEGIN
  -- If task has subtasks, points come from subtasks
  IF NEW.has_subtasks = true THEN
    -- Points will be calculated from completed subtasks
    NEW.points := COALESCE((
      SELECT SUM(points)
      FROM subtasks
      WHERE task_id = NEW.id
        AND id = ANY(NEW.completed_subtask_ids)
    ), 0);
  END IF;
  -- If no subtasks, points stay as set manually

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_points
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.completed_subtask_ids IS DISTINCT FROM NEW.completed_subtask_ids)
  EXECUTE FUNCTION calculate_task_points();

-- Grant permissions
GRANT ALL ON task_categories TO authenticated;
GRANT ALL ON subtasks TO authenticated;
GRANT ALL ON task_photos TO authenticated;
GRANT EXECUTE ON FUNCTION should_rotate_assignee TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_rotation_assignee TO authenticated;