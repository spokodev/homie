#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createCategories() {
  console.log('🏠 Creating default categories for all households...\n');

  const defaultCategories = [
    { name: 'cleaning', icon: '🧹', color: '#4CAF50', is_custom: false },
    { name: 'cooking', icon: '👨‍🍳', color: '#FF9800', is_custom: false },
    { name: 'laundry', icon: '👕', color: '#2196F3', is_custom: false },
    { name: 'organizing', icon: '📦', color: '#9C27B0', is_custom: false },
    { name: 'maintenance', icon: '🔧', color: '#607D8B', is_custom: false },
    { name: 'shopping', icon: '🛒', color: '#FFC107', is_custom: false },
    { name: 'childcare', icon: '👶', color: '#E91E63', is_custom: false },
    { name: 'petcare', icon: '🐾', color: '#795548', is_custom: false },
    { name: 'outdoor', icon: '🌿', color: '#4CAF50', is_custom: false },
    { name: 'financial', icon: '💰', color: '#009688', is_custom: false },
    { name: 'health', icon: '🏥', color: '#F44336', is_custom: false },
    { name: 'other', icon: '📌', color: '#9E9E9E', is_custom: false }
  ];

  try {
    // First, let's check if the table exists by trying different approaches
    console.log('Checking if task_categories table is accessible...');

    // Try 1: Direct select
    const { data: testData, error: testError } = await supabase
      .from('task_categories')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Table not accessible via direct query:', testError.message);
      console.log('\n⚠️  The table might not be created yet.');
      console.log('\nPLEASE RUN THIS IN SUPABASE SQL EDITOR:');
      console.log('----------------------------------------');
      console.log(`
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

ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories in their household" ON task_categories
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.household_id = task_categories.household_id
      AND members.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access" ON task_categories
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
      `);
      console.log('----------------------------------------');
      console.log('\nThen run this script again.');
      return;
    }

    console.log('✅ Table is accessible!\n');

    // Get all households
    const { data: households, error: householdsError } = await supabase
      .from('households')
      .select('id, name');

    if (householdsError) {
      console.error('❌ Error fetching households:', householdsError.message);
      return;
    }

    if (!households || households.length === 0) {
      console.log('No households found in the database.');
      return;
    }

    console.log(`Found ${households.length} household(s):\n`);

    for (const household of households) {
      console.log(`Processing household: ${household.name || household.id}`);

      // Check if categories already exist
      const { data: existing, error: checkError } = await supabase
        .from('task_categories')
        .select('id, name')
        .eq('household_id', household.id);

      if (!checkError && existing && existing.length > 0) {
        console.log(`  ⏭️  Found ${existing.length} existing categories - skipping`);
        continue;
      }

      // Prepare categories for insertion
      const categoriesToInsert = defaultCategories.map(cat => ({
        ...cat,
        household_id: household.id
      }));

      console.log(`  📝 Inserting ${categoriesToInsert.length} categories...`);

      // Insert categories one by one to handle conflicts
      let successCount = 0;
      let errorCount = 0;

      for (const category of categoriesToInsert) {
        const { error: insertError } = await supabase
          .from('task_categories')
          .insert(category);

        if (insertError) {
          if (insertError.message.includes('duplicate')) {
            // Category already exists, that's okay
          } else {
            console.log(`    ❌ Error with ${category.name}: ${insertError.message}`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        console.log(`  ✅ Created ${successCount} categories`);
      }
      if (errorCount > 0) {
        console.log(`  ⚠️  Failed to create ${errorCount} categories`);
      }

      // Verify what was created
      const { data: finalCheck, error: finalError } = await supabase
        .from('task_categories')
        .select('name, icon, color')
        .eq('household_id', household.id)
        .order('name');

      if (!finalError && finalCheck) {
        console.log(`  📊 Final count: ${finalCheck.length} categories in database`);
        if (finalCheck.length > 0) {
          console.log('  Categories: ' + finalCheck.map(c => `${c.icon} ${c.name}`).join(', '));
        }
      }

      console.log('');
    }

    console.log('✨ Category creation complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createCategories().catch(console.error);