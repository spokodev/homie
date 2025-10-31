const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.migration' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey ? supabaseKey.length : 0);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql(sql) {
  // Using Supabase's database functions API
  const { data, error } = await supabase.rpc('query', { query_text: sql });

  if (error) {
    // Try alternative approach
    return { data: null, error };
  }

  return { data, error: null };
}

async function testConnection() {
  console.log('\n🔌 Testing connection...');

  // Test with a simple query
  const { data, error } = await supabase
    .from('households')
    .select('id')
    .limit(1);

  if (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }

  console.log('✅ Connected successfully!');
  return true;
}

async function createRecurringTasksTable() {
  console.log('\n📝 Creating recurring_tasks table...');

  // Since we can't execute raw SQL directly, let's check if the table exists
  // and provide instructions for manual creation
  const { data, error } = await supabase
    .from('recurring_tasks')
    .select('id')
    .limit(1);

  if (!error || error.code !== '42P01') {
    console.log('✅ Table recurring_tasks already exists');
    return true;
  }

  console.log('⚠️  Table recurring_tasks does not exist');
  console.log('   Please run the SQL in Supabase Dashboard SQL Editor');
  return false;
}

async function createNewTables() {
  const tables = [
    { name: 'task_categories', check: true },
    { name: 'subtasks', check: true },
    { name: 'task_photos', check: true }
  ];

  for (const table of tables) {
    console.log(`\n📝 Checking table ${table.name}...`);

    const { data, error } = await supabase
      .from(table.name)
      .select('id')
      .limit(1);

    if (!error || error.code !== '42P01') {
      console.log(`✅ Table ${table.name} exists`);
    } else {
      console.log(`❌ Table ${table.name} does not exist`);
      console.log('   Please create it using SQL Editor');
    }
  }
}

async function createDefaultCategories() {
  console.log('\n🏠 Creating default categories for existing households...');

  try {
    // Get all households
    const { data: households, error } = await supabase
      .from('households')
      .select('id');

    if (error) throw error;

    if (!households || households.length === 0) {
      console.log('   No households found');
      return;
    }

    console.log(`   Found ${households.length} household(s)`);

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
      console.log(`   Processing household: ${household.id}`);

      // Check if categories already exist
      const { data: existing, error: checkError } = await supabase
        .from('task_categories')
        .select('id')
        .eq('household_id', household.id)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`   ⏭️  Categories already exist for household ${household.id}`);
        continue;
      }

      // Create categories for this household
      const categoriesToInsert = defaultCategories.map(cat => ({
        ...cat,
        household_id: household.id
      }));

      const { error: insertError } = await supabase
        .from('task_categories')
        .insert(categoriesToInsert);

      if (insertError) {
        console.log(`   ❌ Error creating categories: ${insertError.message}`);
      } else {
        console.log(`   ✅ Created categories for household ${household.id}`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting Supabase migration check...\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without a valid connection');
    process.exit(1);
  }

  // Check/create tables
  await createRecurringTasksTable();
  await createNewTables();

  // Try to create default categories
  await createDefaultCategories();

  console.log('\n📋 MANUAL STEPS REQUIRED:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Copy and run the SQL from apply-migrations.sql');
  console.log('3. This will create all necessary tables and policies');

  console.log('\n✨ Migration check complete!');
}

main().catch(console.error);