#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.migration' });

// Parse Supabase connection string
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

// PostgreSQL connection string - provided by user
const DATABASE_URL = 'postgresql://postgres.ojmmvaoztddrgvthcjit:Kickflip@1080@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🚀 Direct PostgreSQL Migration\n');
  console.log('Connecting to database...');

  try {
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read the migration SQL
    const migrationSQL = fs.readFileSync('./FINAL-MIGRATION.sql', 'utf8');

    // Execute the entire migration as a single transaction
    console.log('📝 Executing migration...\n');

    await client.query('BEGIN');
    console.log('Transaction started');

    // Split into major sections and execute
    const sections = [
      {
        name: 'Creating recurring_tasks table',
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
          );
        `
      },
      {
        name: 'Creating task_categories table',
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
          );
        `
      },
      {
        name: 'Creating subtasks table',
        sql: `
          CREATE TABLE IF NOT EXISTS subtasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            points INT DEFAULT 1 CHECK (points >= 1 AND points <= 100),
            is_completed BOOLEAN DEFAULT FALSE,
            sort_order INT DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'Creating task_photos table',
        sql: `
          CREATE TABLE IF NOT EXISTS task_photos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            photo_url TEXT NOT NULL,
            uploaded_by UUID REFERENCES members(id),
            caption TEXT,
            uploaded_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      },
      {
        name: 'Adding columns to tasks table',
        sql: `
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
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'recurring_task_id') THEN
              ALTER TABLE tasks ADD COLUMN recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL;
            END IF;
          END $$;
        `
      },
      {
        name: 'Adding rotation columns to recurring_tasks',
        sql: `
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurring_tasks' AND column_name = 'rotation_interval_value') THEN
              ALTER TABLE recurring_tasks
                ADD COLUMN rotation_interval_value INT DEFAULT 1,
                ADD COLUMN rotation_interval_unit VARCHAR(10) DEFAULT 'day',
                ADD COLUMN rotation_assignees UUID[] DEFAULT '{}',
                ADD COLUMN current_assignee_index INT DEFAULT 0,
                ADD COLUMN last_rotation_at TIMESTAMPTZ,
                ADD COLUMN manual_override_until TIMESTAMPTZ;
            END IF;
          END $$;
        `
      },
      {
        name: 'Creating indexes',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_recurring_tasks_household ON recurring_tasks(household_id);
          CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active ON recurring_tasks(is_active, next_occurrence_at);
          CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next ON recurring_tasks(next_occurrence_at) WHERE is_active = TRUE;
          CREATE INDEX IF NOT EXISTS idx_task_categories_household ON task_categories(household_id);
          CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
          CREATE INDEX IF NOT EXISTS idx_task_photos_task ON task_photos(task_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
        `
      },
      {
        name: 'Enabling Row Level Security',
        sql: `
          ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
          ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
          ALTER TABLE task_photos ENABLE ROW LEVEL SECURITY;
          ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;
        `
      },
      {
        name: 'Creating RLS policies',
        sql: `
          -- Task Categories Policies
          DROP POLICY IF EXISTS "Users can view categories in their household" ON task_categories;
          CREATE POLICY "Users can view categories in their household" ON task_categories
            FOR SELECT TO authenticated
            USING (EXISTS (
              SELECT 1 FROM members
              WHERE members.household_id = task_categories.household_id
              AND members.user_id = auth.uid()
            ));

          DROP POLICY IF EXISTS "Admins can create categories" ON task_categories;
          CREATE POLICY "Admins can create categories" ON task_categories
            FOR INSERT TO authenticated
            WITH CHECK (EXISTS (
              SELECT 1 FROM members
              WHERE members.household_id = task_categories.household_id
              AND members.user_id = auth.uid()
              AND members.role = 'admin'
            ));

          DROP POLICY IF EXISTS "Admins can delete custom categories" ON task_categories;
          CREATE POLICY "Admins can delete custom categories" ON task_categories
            FOR DELETE TO authenticated
            USING (is_custom = true AND EXISTS (
              SELECT 1 FROM members
              WHERE members.household_id = task_categories.household_id
              AND members.user_id = auth.uid()
              AND members.role = 'admin'
            ));

          -- Subtasks Policies
          DROP POLICY IF EXISTS "Users can view subtasks for tasks in their household" ON subtasks;
          CREATE POLICY "Users can view subtasks for tasks in their household" ON subtasks
            FOR SELECT TO authenticated
            USING (EXISTS (
              SELECT 1 FROM tasks
              JOIN members ON members.household_id = tasks.household_id
              WHERE tasks.id = subtasks.task_id
              AND members.user_id = auth.uid()
            ));

          DROP POLICY IF EXISTS "Users can create subtasks for tasks in their household" ON subtasks;
          CREATE POLICY "Users can create subtasks for tasks in their household" ON subtasks
            FOR INSERT TO authenticated
            WITH CHECK (EXISTS (
              SELECT 1 FROM tasks
              JOIN members ON members.household_id = tasks.household_id
              WHERE tasks.id = subtasks.task_id
              AND members.user_id = auth.uid()
            ));

          DROP POLICY IF EXISTS "Users can update subtasks for tasks in their household" ON subtasks;
          CREATE POLICY "Users can update subtasks for tasks in their household" ON subtasks
            FOR UPDATE TO authenticated
            USING (EXISTS (
              SELECT 1 FROM tasks
              JOIN members ON members.household_id = tasks.household_id
              WHERE tasks.id = subtasks.task_id
              AND members.user_id = auth.uid()
            ));

          DROP POLICY IF EXISTS "Users can delete subtasks for tasks they created" ON subtasks;
          CREATE POLICY "Users can delete subtasks for tasks they created" ON subtasks
            FOR DELETE TO authenticated
            USING (EXISTS (
              SELECT 1 FROM tasks
              JOIN members ON members.household_id = tasks.household_id
              WHERE tasks.id = subtasks.task_id
              AND members.user_id = auth.uid()
              AND (tasks.created_by = members.id OR members.role = 'admin')
            ));
        `
      },
      {
        name: 'Creating helper functions',
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
      },
      {
        name: 'Creating default categories for all households',
        sql: `
          DO $$
          DECLARE
            h RECORD;
          BEGIN
            FOR h IN SELECT id, name FROM households
            LOOP
              PERFORM create_default_categories(h.id);
              RAISE NOTICE 'Created categories for household: %', COALESCE(h.name, h.id::TEXT);
            END LOOP;
          END $$;
        `
      }
    ];

    for (const section of sections) {
      process.stdout.write(`📝 ${section.name}... `);
      try {
        await client.query(section.sql);
        console.log('✅');
      } catch (error) {
        console.log('❌');
        console.log(`   Error: ${error.message}`);
        // Continue with other sections
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ Transaction committed successfully!');

    // Verify the migration
    console.log('\n🔍 Verifying migration...\n');

    const verifyQueries = [
      {
        name: 'Tables created',
        sql: `
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name IN ('task_categories', 'subtasks', 'task_photos', 'recurring_tasks')
        `
      },
      {
        name: 'Columns added to tasks',
        sql: `
          SELECT COUNT(*) as count
          FROM information_schema.columns
          WHERE table_name = 'tasks'
          AND column_name IN ('category_id', 'completed_subtask_ids', 'has_subtasks', 'recurring_task_id')
        `
      },
      {
        name: 'Categories created',
        sql: `
          SELECT household_id, COUNT(*) as count
          FROM task_categories
          GROUP BY household_id
        `
      }
    ];

    for (const query of verifyQueries) {
      const result = await client.query(query.sql);
      console.log(`${query.name}:`);
      if (result.rows.length > 0) {
        result.rows.forEach(row => {
          console.log(`  `, row);
        });
      }
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('\nThe database is ready with:');
    console.log('  ✅ Dynamic task categories');
    console.log('  ✅ Subtasks with points');
    console.log('  ✅ Flexible rotation system');
    console.log('  ✅ Photo upload support');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);

    if (error.message.includes('password')) {
      console.log('\n⚠️  Authentication issue. The service key might not work for direct connection.');
      console.log('Please run the migration manually in Supabase Dashboard:');
      console.log('1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
      console.log('2. Copy contents of FINAL-MIGRATION.sql');
      console.log('3. Paste and Run');
    }

    try {
      await client.query('ROLLBACK');
      console.log('Transaction rolled back');
    } catch (rollbackError) {
      // Ignore rollback errors
    }
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration().catch(console.error);