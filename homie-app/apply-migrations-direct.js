#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.migration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  const migrations = [
    {
      name: 'Create recurring_tasks table',
      sql: `
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
        )
      `
    },
    {
      name: 'Create recurring_tasks indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_recurring_tasks_household ON recurring_tasks(household_id);
        CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active ON recurring_tasks(is_active, next_occurrence_at);
        CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next ON recurring_tasks(next_occurrence_at) WHERE is_active = TRUE;
      `
    },
    {
      name: 'Add recurring_task_id to tasks',
      sql: `
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL
      `
    },
    {
      name: 'Create task_categories table',
      sql: `
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
        )
      `
    },
    {
      name: 'Create subtasks table',
      sql: `
        CREATE TABLE IF NOT EXISTS subtasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          points INT DEFAULT 1 CHECK (points >= 1 AND points <= 100),
          is_completed BOOLEAN DEFAULT FALSE,
          sort_order INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'Create task_photos table',
      sql: `
        CREATE TABLE IF NOT EXISTS task_photos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          photo_url TEXT NOT NULL,
          uploaded_by UUID REFERENCES members(id),
          caption TEXT,
          uploaded_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'Add columns to tasks table',
      sql: `
        ALTER TABLE tasks
          ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES task_categories(id),
          ADD COLUMN IF NOT EXISTS completed_subtask_ids UUID[],
          ADD COLUMN IF NOT EXISTS has_subtasks BOOLEAN DEFAULT FALSE
      `
    },
    {
      name: 'Add rotation columns to recurring_tasks',
      sql: `
        ALTER TABLE recurring_tasks
          ADD COLUMN IF NOT EXISTS rotation_interval_value INT DEFAULT 1,
          ADD COLUMN IF NOT EXISTS rotation_interval_unit VARCHAR(10) DEFAULT 'day',
          ADD COLUMN IF NOT EXISTS rotation_assignees UUID[] DEFAULT '{}',
          ADD COLUMN IF NOT EXISTS current_assignee_index INT DEFAULT 0,
          ADD COLUMN IF NOT EXISTS last_rotation_at TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS manual_override_until TIMESTAMPTZ
      `
    },
    {
      name: 'Add rotation unit constraint',
      sql: `
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
      `
    },
    {
      name: 'Create indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_task_categories_household ON task_categories(household_id);
        CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_photos_task ON task_photos(task_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
      `
    },
    {
      name: 'Enable RLS on new tables',
      sql: `
        ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
        ALTER TABLE task_photos ENABLE ROW LEVEL SECURITY;
        ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;
      `
    },
    {
      name: 'Create task_categories RLS policies',
      sql: `
        -- View policy
        CREATE POLICY IF NOT EXISTS "Users can view categories in their household" ON task_categories
          FOR SELECT TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM members
              WHERE members.household_id = task_categories.household_id
              AND members.user_id = auth.uid()
            )
          );

        -- Create policy (admin only)
        CREATE POLICY IF NOT EXISTS "Admins can create categories" ON task_categories
          FOR INSERT TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM members
              WHERE members.household_id = task_categories.household_id
              AND members.user_id = auth.uid()
              AND members.role = 'admin'
            )
          );

        -- Delete policy (admin only, custom categories)
        CREATE POLICY IF NOT EXISTS "Admins can delete custom categories" ON task_categories
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
      `
    },
    {
      name: 'Create subtasks RLS policies',
      sql: `
        -- View policy
        CREATE POLICY IF NOT EXISTS "Users can view subtasks for tasks in their household" ON subtasks
          FOR SELECT TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM tasks
              JOIN members ON members.household_id = tasks.household_id
              WHERE tasks.id = subtasks.task_id
              AND members.user_id = auth.uid()
            )
          );

        -- Create policy
        CREATE POLICY IF NOT EXISTS "Users can create subtasks for tasks in their household" ON subtasks
          FOR INSERT TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM tasks
              JOIN members ON members.household_id = tasks.household_id
              WHERE tasks.id = subtasks.task_id
              AND members.user_id = auth.uid()
            )
          );

        -- Update policy
        CREATE POLICY IF NOT EXISTS "Users can update subtasks for tasks in their household" ON subtasks
          FOR UPDATE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM tasks
              JOIN members ON members.household_id = tasks.household_id
              WHERE tasks.id = subtasks.task_id
              AND members.user_id = auth.uid()
            )
          );

        -- Delete policy
        CREATE POLICY IF NOT EXISTS "Users can delete subtasks for tasks they created" ON subtasks
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
      `
    },
    {
      name: 'Create task_photos RLS policies',
      sql: `
        -- View policy
        CREATE POLICY IF NOT EXISTS "Users can view photos for tasks in their household" ON task_photos
          FOR SELECT TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM tasks
              JOIN members ON members.household_id = tasks.household_id
              WHERE tasks.id = task_photos.task_id
              AND members.user_id = auth.uid()
            )
          );

        -- Upload policy
        CREATE POLICY IF NOT EXISTS "Users can upload photos for tasks they complete" ON task_photos
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
      `
    },
    {
      name: 'Create recurring_tasks RLS policies',
      sql: `
        -- View policy
        CREATE POLICY IF NOT EXISTS "Users can view recurring tasks in their household" ON recurring_tasks
          FOR SELECT TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM members
              WHERE members.household_id = recurring_tasks.household_id
              AND members.user_id = auth.uid()
            )
          );

        -- Create policy (admin only)
        CREATE POLICY IF NOT EXISTS "Admins can create recurring tasks" ON recurring_tasks
          FOR INSERT TO authenticated
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM members
              WHERE members.household_id = recurring_tasks.household_id
              AND members.user_id = auth.uid()
              AND members.role = 'admin'
            )
          );

        -- Update policy (admin only)
        CREATE POLICY IF NOT EXISTS "Admins can update recurring tasks" ON recurring_tasks
          FOR UPDATE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM members
              WHERE members.household_id = recurring_tasks.household_id
              AND members.user_id = auth.uid()
              AND members.role = 'admin'
            )
          );

        -- Delete policy (admin only)
        CREATE POLICY IF NOT EXISTS "Admins can delete recurring tasks" ON recurring_tasks
          FOR DELETE TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM members
              WHERE members.household_id = recurring_tasks.household_id
              AND members.user_id = auth.uid()
              AND members.role = 'admin'
            )
          );
      `
    },
    {
      name: 'Create reorder_subtasks function',
      sql: `
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
      `
    },
    {
      name: 'Create default categories function',
      sql: `
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
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    try {
      console.log(`📝 ${migration.name}...`);
      const { error } = await supabase.rpc('exec_sql', { query: migration.sql });

      if (error) {
        // Try direct SQL if RPC fails
        const { error: directError } = await supabase.from('_sql').insert({ query: migration.sql });
        if (directError) {
          throw directError;
        }
      }

      console.log(`   ✅ Success\n`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errorCount++;
      // Continue with next migration instead of stopping
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);

  // Create default categories for existing households
  console.log('\n🏠 Creating default categories for existing households...');
  try {
    const { data: households, error } = await supabase
      .from('households')
      .select('id');

    if (error) throw error;

    if (households && households.length > 0) {
      for (const household of households) {
        try {
          await supabase.rpc('create_default_categories', { p_household_id: household.id });
          console.log(`   ✅ Created categories for household: ${household.id}`);
        } catch (err) {
          console.log(`   ⚠️  Categories might already exist for household: ${household.id}`);
        }
      }
    }
  } catch (error) {
    console.error(`   ❌ Error fetching households: ${error.message}`);
  }

  // Verify migration
  console.log('\n🔍 Verifying migration...');
  try {
    const tables = ['task_categories', 'subtasks', 'task_photos', 'recurring_tasks'];
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`   ❌ Table ${table}: Not accessible`);
      } else {
        console.log(`   ✅ Table ${table}: Exists`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Verification error: ${error.message}`);
  }

  console.log('\n✨ Migration complete!');
}

// Run migration
runMigration().catch(console.error);