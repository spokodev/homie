-- ============================================
-- COMPLETE MIGRATION SCRIPT FOR HOMIELIFE APP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- STEP 1: Create recurring_tasks table (if missing)
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  room TEXT,
  estimated_minutes INTEGER,
  points INTEGER,
  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,
  recurrence_rule JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMPTZ,
  next_occurrence_at TIMESTAMPTZ NOT NULL,
  total_occurrences INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for recurring_tasks
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_household ON recurring_tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active ON recurring_tasks(is_active, next_occurrence_at);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next ON recurring_tasks(next_occurrence_at) WHERE is_active = TRUE;

-- Add recurring_task_id to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'recurring_task_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- STEP 2: Create new tables for categories, subtasks, and photos
-- ============================================

-- Task Categories
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

-- Subtasks
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  points INT DEFAULT 1 CHECK (points >= 1 AND points <= 100),
  is_completed BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Photos
CREATE TABLE IF NOT EXISTS task_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES members(id),
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Add new columns to existing tables
-- ============================================

-- Add columns to tasks table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'category_id') THEN
    ALTER TABLE tasks ADD COLUMN category_id UUID REFERENCES task_categories(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_subtask_ids') THEN
    ALTER TABLE tasks ADD COLUMN completed_subtask_ids UUID[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'has_subtasks') THEN
    ALTER TABLE tasks ADD COLUMN has_subtasks BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add rotation columns to recurring_tasks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurring_tasks' AND column_name = 'rotation_interval_value') THEN
    ALTER TABLE recurring_tasks ADD COLUMN rotation_interval_value INT DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurring_tasks' AND column_name = 'rotation_interval_unit') THEN
    ALTER TABLE recurring_tasks ADD COLUMN rotation_interval_unit VARCHAR(10) DEFAULT 'day';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurring_tasks' AND column_name = 'rotation_assignees') THEN
    ALTER TABLE recurring_tasks ADD COLUMN rotation_assignees UUID[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurring_tasks' AND column_name = 'current_assignee_index') THEN
    ALTER TABLE recurring_tasks ADD COLUMN current_assignee_index INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurring_tasks' AND column_name = 'last_rotation_at') THEN
    ALTER TABLE recurring_tasks ADD COLUMN last_rotation_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurring_tasks' AND column_name = 'manual_override_until') THEN
    ALTER TABLE recurring_tasks ADD COLUMN manual_override_until TIMESTAMPTZ;
  END IF;
END $$;

-- Add rotation unit constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_rotation_unit'
  ) THEN
    ALTER TABLE recurring_tasks
    ADD CONSTRAINT check_rotation_unit
    CHECK (rotation_interval_unit IN ('minute', 'hour', 'day', 'week', 'month', 'year'));
  END IF;
END $$;

-- STEP 4: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_task_categories_household ON task_categories(household_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_photos_task ON task_photos(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);

-- STEP 5: Enable Row Level Security
-- ============================================
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create RLS Policies
-- ============================================

-- Task Categories Policies
DROP POLICY IF EXISTS "Users can view categories in their household" ON task_categories;
CREATE POLICY "Users can view categories in their household" ON task_categories
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.household_id = task_categories.household_id
      AND members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create categories" ON task_categories;
CREATE POLICY "Admins can create categories" ON task_categories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.household_id = task_categories.household_id
      AND members.user_id = auth.uid()
      AND members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete custom categories" ON task_categories;
CREATE POLICY "Admins can delete custom categories" ON task_categories
  FOR DELETE TO authenticated
  USING (
    is_custom = true AND
    EXISTS (
      SELECT 1 FROM members
      WHERE members.household_id = task_categories.household_id
      AND members.user_id = auth.uid()
      AND members.role = 'admin'
    )
  );

-- Subtasks Policies
DROP POLICY IF EXISTS "Users can view subtasks for tasks in their household" ON subtasks;
CREATE POLICY "Users can view subtasks for tasks in their household" ON subtasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN members ON members.household_id = tasks.household_id
      WHERE tasks.id = subtasks.task_id
      AND members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create subtasks for tasks in their household" ON subtasks;
CREATE POLICY "Users can create subtasks for tasks in their household" ON subtasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN members ON members.household_id = tasks.household_id
      WHERE tasks.id = subtasks.task_id
      AND members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update subtasks for tasks in their household" ON subtasks;
CREATE POLICY "Users can update subtasks for tasks in their household" ON subtasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN members ON members.household_id = tasks.household_id
      WHERE tasks.id = subtasks.task_id
      AND members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete subtasks for tasks they created" ON subtasks;
CREATE POLICY "Users can delete subtasks for tasks they created" ON subtasks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN members ON members.household_id = tasks.household_id
      WHERE tasks.id = subtasks.task_id
      AND members.user_id = auth.uid()
      AND (tasks.created_by = members.id OR members.role = 'admin')
    )
  );

-- Task Photos Policies
DROP POLICY IF EXISTS "Users can view photos for tasks in their household" ON task_photos;
CREATE POLICY "Users can view photos for tasks in their household" ON task_photos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN members ON members.household_id = tasks.household_id
      WHERE tasks.id = task_photos.task_id
      AND members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can upload photos for tasks they complete" ON task_photos;
CREATE POLICY "Users can upload photos for tasks they complete" ON task_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN members ON members.household_id = tasks.household_id
      WHERE tasks.id = task_photos.task_id
      AND members.user_id = auth.uid()
      AND (tasks.assignee_id = members.id OR tasks.assignee_id IS NULL)
    )
  );

-- Recurring Tasks Policies
DROP POLICY IF EXISTS "Users can view recurring tasks in their household" ON recurring_tasks;
CREATE POLICY "Users can view recurring tasks in their household" ON recurring_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.household_id = recurring_tasks.household_id
      AND members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can create recurring tasks" ON recurring_tasks;
CREATE POLICY "Admins can create recurring tasks" ON recurring_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.household_id = recurring_tasks.household_id
      AND members.user_id = auth.uid()
      AND members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update recurring tasks" ON recurring_tasks;
CREATE POLICY "Admins can update recurring tasks" ON recurring_tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.household_id = recurring_tasks.household_id
      AND members.user_id = auth.uid()
      AND members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete recurring tasks" ON recurring_tasks;
CREATE POLICY "Admins can delete recurring tasks" ON recurring_tasks
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.household_id = recurring_tasks.household_id
      AND members.user_id = auth.uid()
      AND members.role = 'admin'
    )
  );

-- STEP 7: Create helper functions
-- ============================================

-- Function to reorder subtasks
CREATE OR REPLACE FUNCTION reorder_subtasks(
  p_task_id UUID,
  p_subtask_ids UUID[]
)
RETURNS void AS $$
DECLARE
  v_index INT;
  v_subtask_id UUID;
BEGIN
  v_index := 0;
  FOREACH v_subtask_id IN ARRAY p_subtask_ids
  LOOP
    UPDATE subtasks
    SET sort_order = v_index
    WHERE id = v_subtask_id AND task_id = p_task_id;
    v_index := v_index + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default categories
CREATE OR REPLACE FUNCTION create_default_categories(p_household_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO task_categories (household_id, name, icon, color, is_custom)
  VALUES
    (p_household_id, 'cleaning', '🧹', '#4CAF50', false),
    (p_household_id, 'cooking', '👨‍🍳', '#FF9800', false),
    (p_household_id, 'laundry', '👕', '#2196F3', false),
    (p_household_id, 'organizing', '📦', '#9C27B0', false),
    (p_household_id, 'maintenance', '🔧', '#607D8B', false),
    (p_household_id, 'shopping', '🛒', '#FFC107', false),
    (p_household_id, 'childcare', '👶', '#E91E63', false),
    (p_household_id, 'petcare', '🐾', '#795548', false),
    (p_household_id, 'outdoor', '🌿', '#4CAF50', false),
    (p_household_id, 'financial', '💰', '#009688', false),
    (p_household_id, 'health', '🏥', '#F44336', false),
    (p_household_id, 'other', '📌', '#9E9E9E', false)
  ON CONFLICT (household_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 8: Create default categories for all existing households
-- ============================================
DO $$
DECLARE
  h RECORD;
BEGIN
  FOR h IN SELECT id FROM households
  LOOP
    PERFORM create_default_categories(h.id);
  END LOOP;
END $$;

-- STEP 9: Verification
-- ============================================
-- Check if all tables were created
SELECT 'Tables Created:' as status,
       COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('task_categories', 'subtasks', 'task_photos', 'recurring_tasks');

-- Check if columns were added to tasks
SELECT 'Columns in tasks table:' as status,
       COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name IN ('category_id', 'completed_subtask_ids', 'has_subtasks', 'recurring_task_id');

-- Check if columns were added to recurring_tasks
SELECT 'Rotation columns in recurring_tasks:' as status,
       COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'recurring_tasks'
AND column_name IN ('rotation_interval_value', 'rotation_interval_unit', 'rotation_assignees',
                    'current_assignee_index', 'last_rotation_at', 'manual_override_until');

-- Count RLS policies
SELECT 'RLS Policies created:' as status,
       COUNT(*) as count
FROM pg_policies
WHERE tablename IN ('task_categories', 'subtasks', 'task_photos', 'recurring_tasks');

-- Show categories created
SELECT 'Categories per household:' as status,
       household_id,
       COUNT(*) as category_count
FROM task_categories
GROUP BY household_id;

-- ============================================
-- MIGRATION COMPLETE!
-- You should see:
-- - 4 tables created
-- - 4 columns in tasks table
-- - 6 rotation columns in recurring_tasks
-- - 12+ RLS policies
-- - 12 categories per household
-- ============================================