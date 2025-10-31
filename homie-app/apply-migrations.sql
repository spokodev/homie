-- Apply All Migrations for HomieLife App
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: Create Tables
-- ============================================

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
  points INT DEFAULT 1 CHECK (points >= 1 AND points <= 100),
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
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: Modify Existing Tables
-- ============================================

-- 4. Modify tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES task_categories(id),
  ADD COLUMN IF NOT EXISTS completed_subtask_ids UUID[],
  ADD COLUMN IF NOT EXISTS has_subtasks BOOLEAN DEFAULT FALSE;

-- 5. Modify recurring_tasks for flexible rotation
ALTER TABLE recurring_tasks
  ADD COLUMN IF NOT EXISTS rotation_interval_value INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rotation_interval_unit VARCHAR(10) DEFAULT 'day',
  ADD COLUMN IF NOT EXISTS rotation_assignees UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS current_assignee_index INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rotation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manual_override_until TIMESTAMPTZ;

-- Add constraint for rotation unit
ALTER TABLE recurring_tasks
  ADD CONSTRAINT check_rotation_unit
  CHECK (rotation_interval_unit IN ('minute', 'hour', 'day', 'week', 'month', 'year'));

-- ============================================
-- PART 3: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_task_categories_household ON task_categories(household_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_photos_task ON task_photos(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);

-- ============================================
-- PART 4: Row Level Security (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_photos ENABLE ROW LEVEL SECURITY;

-- Task Categories Policies
CREATE POLICY "Users can view categories in their household" ON task_categories
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.household_id = task_categories.household_id
      AND members.user_id = auth.uid()
    )
  );

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

-- ============================================
-- PART 5: Create RPC Function for Reordering
-- ============================================

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

-- ============================================
-- PART 6: Insert Default Categories
-- ============================================

-- This will be done programmatically for each household when needed
-- or you can create a function to insert default categories

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

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if tables were created
SELECT 'Tables Created:' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('task_categories', 'subtasks', 'task_photos');

-- Check if columns were added
SELECT 'Columns Added to tasks:' as status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name IN ('category_id', 'completed_subtask_ids', 'has_subtasks');

-- Check if columns were added to recurring_tasks
SELECT 'Columns Added to recurring_tasks:' as status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'recurring_tasks'
AND column_name IN ('rotation_interval_value', 'rotation_interval_unit', 'rotation_assignees');

-- Check RLS policies
SELECT 'RLS Policies Created:' as status;
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('task_categories', 'subtasks', 'task_photos')
ORDER BY tablename, policyname;