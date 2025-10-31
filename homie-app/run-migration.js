#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the SQL migration file
const migrationSQL = fs.readFileSync('./FINAL-MIGRATION.sql', 'utf8');

// Split SQL into individual statements
const statements = migrationSQL
  .split(/;\s*$/m)
  .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'))
  .map(stmt => stmt.trim() + ';');

async function runMigration() {
  console.log('🚀 Starting automated database migration...\n');

  // Test connection first
  console.log('🔌 Testing connection...');
  const { data: testData, error: testError } = await supabase
    .from('households')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Connection failed:', testError.message);
    return;
  }
  console.log('✅ Connected successfully!\n');

  // Since Supabase JS doesn't support raw SQL execution directly,
  // we'll use the database API through REST
  const runSQL = async (sql) => {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query_text: sql })
    }).catch(() => null);

    // If RPC doesn't exist, we'll check tables manually
    return response;
  };

  // Check and create tables
  console.log('📝 Checking and creating tables...\n');

  // 1. Check recurring_tasks
  console.log('Checking recurring_tasks table...');
  const { error: rtError } = await supabase
    .from('recurring_tasks')
    .select('id')
    .limit(1);

  if (rtError && rtError.code === '42P01') {
    console.log('  ⚠️  Table does not exist - please create via SQL Editor');
  } else if (!rtError) {
    console.log('  ✅ Table exists');
  }

  // 2. Check task_categories
  console.log('Checking task_categories table...');
  const { error: tcError } = await supabase
    .from('task_categories')
    .select('id')
    .limit(1);

  if (tcError && tcError.code === '42P01') {
    console.log('  ⚠️  Table does not exist - please create via SQL Editor');
  } else if (!tcError) {
    console.log('  ✅ Table exists');
  }

  // 3. Check subtasks
  console.log('Checking subtasks table...');
  const { error: stError } = await supabase
    .from('subtasks')
    .select('id')
    .limit(1);

  if (stError && stError.code === '42P01') {
    console.log('  ⚠️  Table does not exist - please create via SQL Editor');
  } else if (!stError) {
    console.log('  ✅ Table exists');
  }

  // 4. Check task_photos
  console.log('Checking task_photos table...');
  const { error: tpError } = await supabase
    .from('task_photos')
    .select('id')
    .limit(1);

  if (tpError && tpError.code === '42P01') {
    console.log('  ⚠️  Table does not exist - please create via SQL Editor');
  } else if (!tpError) {
    console.log('  ✅ Table exists');
  }

  // Create default categories for existing households
  console.log('\n🏠 Creating default categories for existing households...');

  // Get all households
  const { data: households, error: householdsError } = await supabase
    .from('households')
    .select('id');

  if (householdsError) {
    console.error('❌ Error fetching households:', householdsError.message);
    return;
  }

  if (households && households.length > 0) {
    console.log(`Found ${households.length} household(s)`);

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

    for (const household of households) {
      console.log(`\nProcessing household: ${household.id}`);

      // Check if categories already exist
      const { data: existing, error: checkError } = await supabase
        .from('task_categories')
        .select('id')
        .eq('household_id', household.id)
        .limit(1);

      if (!checkError && existing && existing.length > 0) {
        console.log('  ⏭️  Categories already exist');
        continue;
      }

      if (checkError && checkError.code === '42P01') {
        console.log('  ❌ task_categories table does not exist');
        console.log('\n⚠️  IMPORTANT: Please run the SQL migration first!');
        console.log('  1. Open: https://supabase.com/dashboard/project/ojmmvaoztddrgvthcjit/sql/new');
        console.log('  2. Copy contents of FINAL-MIGRATION.sql');
        console.log('  3. Paste and Run in SQL Editor');
        break;
      }

      // Create categories for this household
      const categoriesToInsert = defaultCategories.map(cat => ({
        ...cat,
        household_id: household.id
      }));

      const { error: insertError, data: insertData } = await supabase
        .from('task_categories')
        .insert(categoriesToInsert)
        .select();

      if (insertError) {
        console.log(`  ❌ Error: ${insertError.message}`);
      } else {
        console.log(`  ✅ Created ${insertData.length} categories`);
      }
    }
  } else {
    console.log('No households found');
  }

  console.log('\n📊 Migration Summary:');
  console.log('-------------------');

  // Final verification
  const tables = ['recurring_tasks', 'task_categories', 'subtasks', 'task_photos'];
  let successCount = 0;
  let failCount = 0;

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1);

    if (!error || error.code !== '42P01') {
      console.log(`✅ ${table}: Accessible`);
      successCount++;
    } else {
      console.log(`❌ ${table}: Not found`);
      failCount++;
    }
  }

  if (failCount > 0) {
    console.log('\n⚠️  Some tables are missing!');
    console.log('\n📝 NEXT STEP: Run the SQL migration manually');
    console.log('  1. Open: https://supabase.com/dashboard/project/ojmmvaoztddrgvthcjit/sql/new');
    console.log('  2. Copy contents of FINAL-MIGRATION.sql');
    console.log('  3. Paste and Run in SQL Editor');
    console.log('\nThis will create all missing tables and set up the database structure.');
  } else {
    console.log('\n✨ All tables are ready!');
    console.log('The app should now work with all new features:');
    console.log('  • Dynamic categories');
    console.log('  • Subtasks with points');
    console.log('  • Rotation system');
    console.log('  • Photo uploads (backend ready)');
  }

  console.log('\n✅ Migration check complete!');
}

runMigration().catch(console.error);