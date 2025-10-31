-- Migration: Dynamic Task Templates
-- Date: 2025-10-31
-- Description: Create task_templates table for customizable templates per household

-- Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  description TEXT,
  estimated_minutes INT,
  points INT DEFAULT 10,
  category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL,
  room TEXT,
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false, -- System templates cannot be deleted
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT task_templates_name_household_unique UNIQUE(household_id, name),
  CONSTRAINT task_templates_points_check CHECK (points >= 1 AND points <= 1000),
  CONSTRAINT task_templates_estimated_minutes_check CHECK (estimated_minutes IS NULL OR estimated_minutes > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_household_id ON task_templates(household_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_by ON task_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_task_templates_category_id ON task_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_is_default ON task_templates(is_default) WHERE is_default = true;

-- Add updated_at trigger
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view templates in their household
CREATE POLICY "Users can view household templates"
  ON task_templates
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Members can create templates
CREATE POLICY "Members can create templates"
  ON task_templates
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
    )
    AND created_by IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Members can update their own templates (non-system only)
CREATE POLICY "Members can update own templates"
  ON task_templates
  FOR UPDATE
  USING (
    is_system = false
    AND created_by IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    is_system = false
    AND created_by IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Members can delete their own templates (non-system only)
CREATE POLICY "Members can delete own templates"
  ON task_templates
  FOR DELETE
  USING (
    is_system = false
    AND created_by IN (
      SELECT id FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can manage all templates (except system templates deletion)
CREATE POLICY "Admins can manage household templates"
  ON task_templates
  FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
    AND (CASE WHEN current_setting('request.method', true) = 'DELETE' THEN is_system = false ELSE true END)
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Insert default system templates
-- These will be copied to each household on creation
INSERT INTO task_templates (name, icon, description, estimated_minutes, points, is_system, is_default)
VALUES
  ('Quick Clean', '🧹', 'Quick tidy up of common areas', 15, 10, true, true),
  ('Do Dishes', '🍽️', 'Wash and put away dishes', 20, 15, true, true),
  ('Take Out Trash', '🗑️', 'Empty all trash bins', 10, 10, true, true),
  ('Vacuum', '🧹', 'Vacuum all floors', 30, 20, true, true),
  ('Laundry', '👕', 'Wash, dry, and fold laundry', 60, 25, true, true),
  ('Grocery Shopping', '🛒', 'Buy household groceries', 45, 20, true, true),
  ('Cook Dinner', '🍳', 'Prepare dinner for household', 45, 25, true, true),
  ('Clean Bathroom', '🚽', 'Deep clean bathroom', 30, 20, true, true)
ON CONFLICT (household_id, name) DO NOTHING;

-- Function to copy default templates to new household
CREATE OR REPLACE FUNCTION copy_default_templates_to_household()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Copy system templates to new household
  INSERT INTO task_templates (
    household_id,
    name,
    icon,
    description,
    estimated_minutes,
    points,
    is_default,
    is_system
  )
  SELECT
    NEW.id,
    name,
    icon,
    description,
    estimated_minutes,
    points,
    true,
    false -- Make them non-system for the household so they can be customized
  FROM task_templates
  WHERE is_system = true
  ON CONFLICT (household_id, name) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger to copy templates when household is created
CREATE TRIGGER copy_templates_on_household_creation
  AFTER INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION copy_default_templates_to_household();

-- Function to create task from template
CREATE OR REPLACE FUNCTION create_task_from_template(
  template_uuid UUID,
  assignee_uuid UUID DEFAULT NULL,
  due_datetime TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_task_id UUID;
  template_rec RECORD;
  member_rec RECORD;
BEGIN
  -- Get template details
  SELECT * INTO template_rec
  FROM task_templates
  WHERE id = template_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  -- Get member details for created_by
  SELECT * INTO member_rec
  FROM members
  WHERE user_id = auth.uid()
  AND household_id = template_rec.household_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not member of household';
  END IF;

  -- Create task from template
  INSERT INTO tasks (
    household_id,
    title,
    description,
    estimated_minutes,
    points,
    room,
    category_id,
    assignee_id,
    due_date,
    created_by,
    status
  ) VALUES (
    template_rec.household_id,
    template_rec.name,
    template_rec.description,
    template_rec.estimated_minutes,
    template_rec.points,
    template_rec.room,
    template_rec.category_id,
    assignee_uuid,
    due_datetime,
    member_rec.id,
    'pending'
  )
  RETURNING id INTO new_task_id;

  RETURN new_task_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_task_from_template(UUID, UUID, TIMESTAMPTZ) TO authenticated;

-- Add comments
COMMENT ON TABLE task_templates IS 'Task templates for quick task creation';
COMMENT ON COLUMN task_templates.is_system IS 'System templates are read-only defaults';
COMMENT ON COLUMN task_templates.is_default IS 'Default templates shown first in UI';
COMMENT ON FUNCTION create_task_from_template IS 'Create a new task from a template';
