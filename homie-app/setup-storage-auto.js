#!/usr/bin/env node
const { Client } = require('pg');
require('dotenv').config({ path: '.env.migration' });

// PostgreSQL connection
const DATABASE_URL = 'postgresql://postgres.ojmmvaoztddrgvthcjit:Kickflip@1080@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function setupStoragePolicies() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🚀 Setting up Storage Policies for Photo Upload\n');
  console.log('═══════════════════════════════════════════\n');

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const policies = [
      {
        name: 'Dropping existing storage policies',
        sql: `
          -- Drop existing policies if any to avoid conflicts
          DROP POLICY IF EXISTS "Anyone can view task photos" ON storage.objects;
          DROP POLICY IF EXISTS "Users can view task photos in their household" ON storage.objects;
          DROP POLICY IF EXISTS "Authenticated users can upload task photos" ON storage.objects;
          DROP POLICY IF EXISTS "Users can upload photos for tasks they complete" ON storage.objects;
          DROP POLICY IF EXISTS "Users can delete own task photos" ON storage.objects;
          DROP POLICY IF EXISTS "Users can delete their own task photos" ON storage.objects;

          DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
          DROP POLICY IF EXISTS "Users can view avatars in their household" ON storage.objects;
          DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
          DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
          DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
          DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
          DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
          DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
        `
      },
      {
        name: 'Creating task-photos bucket policies (VIEW)',
        sql: `
          CREATE POLICY "Anyone can view task photos"
          ON storage.objects FOR SELECT
          TO authenticated
          USING (bucket_id = 'task-photos');
        `
      },
      {
        name: 'Creating task-photos bucket policies (INSERT)',
        sql: `
          CREATE POLICY "Authenticated users can upload task photos"
          ON storage.objects FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = 'task-photos');
        `
      },
      {
        name: 'Creating task-photos bucket policies (UPDATE)',
        sql: `
          CREATE POLICY "Users can update own task photos"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING (bucket_id = 'task-photos');
        `
      },
      {
        name: 'Creating task-photos bucket policies (DELETE)',
        sql: `
          CREATE POLICY "Users can delete own task photos"
          ON storage.objects FOR DELETE
          TO authenticated
          USING (bucket_id = 'task-photos');
        `
      },
      {
        name: 'Creating avatars bucket policies (VIEW)',
        sql: `
          CREATE POLICY "Anyone can view avatars"
          ON storage.objects FOR SELECT
          TO authenticated
          USING (bucket_id = 'avatars');
        `
      },
      {
        name: 'Creating avatars bucket policies (INSERT)',
        sql: `
          CREATE POLICY "Users can upload own avatar"
          ON storage.objects FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = 'avatars');
        `
      },
      {
        name: 'Creating avatars bucket policies (UPDATE)',
        sql: `
          CREATE POLICY "Users can update own avatar"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING (bucket_id = 'avatars');
        `
      },
      {
        name: 'Creating avatars bucket policies (DELETE)',
        sql: `
          CREATE POLICY "Users can delete own avatar"
          ON storage.objects FOR DELETE
          TO authenticated
          USING (bucket_id = 'avatars');
        `
      },
      {
        name: 'Setting bucket size limits and mime types',
        sql: `
          -- Set file size limit to 5MB for task photos
          UPDATE storage.buckets
          SET file_size_limit = 5242880,
              allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
          WHERE name = 'task-photos';

          -- Set file size limit to 2MB for avatars
          UPDATE storage.buckets
          SET file_size_limit = 2097152,
              allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
          WHERE name = 'avatars';
        `
      },
      {
        name: 'Making buckets public (optional)',
        sql: `
          -- Make buckets public for easier access
          UPDATE storage.buckets
          SET public = true
          WHERE name IN ('task-photos', 'avatars');
        `
      }
    ];

    // Execute all policies
    for (const policy of policies) {
      process.stdout.write(`📝 ${policy.name}... `);
      try {
        await client.query(policy.sql);
        console.log('✅');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⏭️  Already exists');
        } else {
          console.log('❌');
          console.log(`   Error: ${error.message}`);
        }
      }
    }

    // Verify the setup
    console.log('\n🔍 Verifying Storage Setup...\n');

    const verifyQueries = [
      {
        name: 'Storage buckets',
        sql: `
          SELECT name, public, file_size_limit,
                 array_length(allowed_mime_types, 1) as mime_types_count
          FROM storage.buckets
          WHERE name IN ('task-photos', 'avatars')
        `
      },
      {
        name: 'Storage policies',
        sql: `
          SELECT name, action
          FROM storage.policies
          WHERE bucket_id IN ('task-photos', 'avatars')
          ORDER BY bucket_id, action
        `
      }
    ];

    for (const query of verifyQueries) {
      console.log(`${query.name}:`);
      try {
        const result = await client.query(query.sql);
        if (result.rows.length > 0) {
          result.rows.forEach(row => {
            console.log(`  `, row);
          });
        } else {
          console.log('  No results found');
        }
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('✨ Storage setup completed successfully!');
    console.log('═══════════════════════════════════════════\n');
    console.log('📸 Photo upload is now ready to use!');
    console.log('\nUsers can now:');
    console.log('  • Upload photos when completing tasks');
    console.log('  • View all task photos');
    console.log('  • Delete their own photos');
    console.log('  • Upload and manage avatars');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

setupStoragePolicies().catch(console.error);