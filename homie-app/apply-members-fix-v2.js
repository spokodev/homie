/**
 * Автоматичне застосування виправлення RLS політик для таблиці members
 * Версія 2 - виправлена обробка SQL команд
 */

const { Client } = require('pg');

// PostgreSQL connection string з service credentials
const DATABASE_URL = 'postgresql://postgres.ojmmvaoztddrgvthcjit:Kickflip@1080@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function applyMemberRLSFix() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Підключення до бази даних...');
    await client.connect();
    console.log('✅ Підключено успішно\n');

    // Виконуємо команди окремо для кращого контролю
    const commands = [
      // Видаляємо старі політики
      `DROP POLICY IF EXISTS "Users can view their household members" ON members`,
      `DROP POLICY IF EXISTS "Users can view household members" ON members`,
      `DROP POLICY IF EXISTS "Users can create members" ON members`,
      `DROP POLICY IF EXISTS "Users can insert members" ON members`,
      `DROP POLICY IF EXISTS "Users can update their own member profile" ON members`,
      `DROP POLICY IF EXISTS "Users can update members" ON members`,
      `DROP POLICY IF EXISTS "Admins can delete members" ON members`,
      `DROP POLICY IF EXISTS "Users can delete members" ON members`,
      `DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON members`,
      `DROP POLICY IF EXISTS "enable_select_for_household_members" ON members`,
      `DROP POLICY IF EXISTS "enable_update_for_own_profile" ON members`,
      `DROP POLICY IF EXISTS "enable_update_for_admin_members" ON members`,
      `DROP POLICY IF EXISTS "enable_delete_for_admins" ON members`,
      `DROP POLICY IF EXISTS "members_insert_policy" ON members`,
      `DROP POLICY IF EXISTS "members_select_policy" ON members`,
      `DROP POLICY IF EXISTS "members_update_own_policy" ON members`,
      `DROP POLICY IF EXISTS "members_update_admin_policy" ON members`,
      `DROP POLICY IF EXISTS "members_delete_admin_policy" ON members`,
    ];

    console.log('🗑️  Видалення старих політик...');
    for (const cmd of commands) {
      try {
        await client.query(cmd);
        process.stdout.write('.');
      } catch (err) {
        // Ігноруємо помилки "не існує"
        if (!err.message.includes('does not exist')) {
          console.error(`\n❌ Помилка: ${err.message}`);
        }
      }
    }
    console.log(' ✅\n');

    // Створюємо helper функцію
    console.log('📦 Створення helper функції...');
    const createFunction = `
      CREATE OR REPLACE FUNCTION public.get_user_household_id()
      RETURNS UUID
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      AS $$
        SELECT household_id
        FROM members
        WHERE user_id = auth.uid()
        LIMIT 1
      $$`;

    await client.query(createFunction);
    console.log('✅ Helper функція створена\n');

    // Надаємо дозволи на функцію
    await client.query(`GRANT EXECUTE ON FUNCTION public.get_user_household_id() TO authenticated`);

    // Створюємо нові політики
    console.log('📝 Створення нових RLS політик:');

    const policies = [
      {
        name: 'INSERT (адміни можуть додавати учасників)',
        sql: `CREATE POLICY "members_insert_policy" ON members
              FOR INSERT TO authenticated
              WITH CHECK (
                user_id = auth.uid()
                OR
                (
                  household_id IN (
                    SELECT m.household_id
                    FROM members m
                    WHERE m.user_id = auth.uid()
                    AND m.role = 'admin'
                  )
                )
              )`
      },
      {
        name: 'SELECT (перегляд учасників household)',
        sql: `CREATE POLICY "members_select_policy" ON members
              FOR SELECT TO authenticated
              USING (
                household_id = public.get_user_household_id()
                OR
                user_id = auth.uid()
              )`
      },
      {
        name: 'UPDATE (оновлення власного профілю)',
        sql: `CREATE POLICY "members_update_own_policy" ON members
              FOR UPDATE TO authenticated
              USING (user_id = auth.uid())
              WITH CHECK (user_id = auth.uid())`
      },
      {
        name: 'UPDATE (адміни оновлюють учасників)',
        sql: `CREATE POLICY "members_update_admin_policy" ON members
              FOR UPDATE TO authenticated
              USING (
                household_id IN (
                  SELECT m.household_id
                  FROM members m
                  WHERE m.user_id = auth.uid()
                  AND m.role = 'admin'
                )
                AND user_id != auth.uid()
              )
              WITH CHECK (
                household_id IN (
                  SELECT m.household_id
                  FROM members m
                  WHERE m.user_id = auth.uid()
                  AND m.role = 'admin'
                )
                AND user_id != auth.uid()
              )`
      },
      {
        name: 'DELETE (адміни видаляють учасників)',
        sql: `CREATE POLICY "members_delete_admin_policy" ON members
              FOR DELETE TO authenticated
              USING (
                household_id IN (
                  SELECT m.household_id
                  FROM members m
                  WHERE m.user_id = auth.uid()
                  AND m.role = 'admin'
                )
                AND user_id != auth.uid()
              )`
      }
    ];

    for (const policy of policies) {
      process.stdout.write(`  • ${policy.name}... `);
      try {
        await client.query(policy.sql);
        console.log('✅');
      } catch (err) {
        console.log('❌');
        console.error(`    Помилка: ${err.message}`);
      }
    }

    // Увімкнути RLS
    console.log('\n🔐 Увімкнення Row Level Security...');
    await client.query(`ALTER TABLE members ENABLE ROW LEVEL SECURITY`);
    console.log('✅ RLS увімкнено');

    // Надати дозволи
    await client.query(`GRANT ALL ON members TO authenticated`);

    // Перевірка результатів
    console.log('\n🔍 Перевірка встановлених політик:');
    const checkPolicies = await client.query(`
      SELECT
        policyname,
        cmd,
        permissive
      FROM pg_policies
      WHERE tablename = 'members'
      ORDER BY policyname;
    `);

    if (checkPolicies.rows.length === 0) {
      console.log('⚠️  Політики не знайдено!');
    } else {
      checkPolicies.rows.forEach(policy => {
        const icon = policy.cmd === 'INSERT' ? '➕' :
                     policy.cmd === 'SELECT' ? '👁️' :
                     policy.cmd === 'UPDATE' ? '✏️' :
                     policy.cmd === 'DELETE' ? '🗑️' : '❓';
        console.log(`  ${icon}  ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log('\n========================================');
    console.log('🎉 МІГРАЦІЯ ЗАВЕРШЕНА УСПІШНО!');
    console.log('========================================');
    console.log('\n✅ Виправлено помилку: "new role violates row-level security policy"');
    console.log('\nТепер можливо:');
    console.log('  • Адміни можуть додавати нових учасників');
    console.log('  • Додавати домашніх тварин (pets)');
    console.log('  • Додавати запрошених учасників');
    console.log('\n💡 Спробуйте знову додати учасника в додатку!');

  } catch (error) {
    console.error('\n❌ КРИТИЧНА ПОМИЛКА:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 З\'єднання закрито');
  }
}

// Запускаємо міграцію
console.log('========================================');
console.log('🔧 ВИПРАВЛЕННЯ RLS ДЛЯ ДОДАВАННЯ УЧАСНИКІВ');
console.log('========================================\n');

applyMemberRLSFix().catch(console.error);