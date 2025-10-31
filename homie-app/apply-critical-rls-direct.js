/**
 * Пряме застосування критичних RLS виправлень
 * Виправляє найважливіші проблеми з безпекою
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.ojmmvaoztddrgvthcjit:Kickflip@1080@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function applyCriticalRLSFixes() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Підключення до бази даних...');
    await client.connect();
    console.log('✅ Підключено успішно\n');

    console.log('========================================');
    console.log('🛡️  КРИТИЧНІ ВИПРАВЛЕННЯ RLS');
    console.log('========================================\n');

    const fixes = [
      {
        name: '1️⃣  POINTS_LEDGER - Додавання відсутніх політик',
        severity: 'CRITICAL',
        commands: [
          `ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY`,
          `DROP POLICY IF EXISTS "Users can view household points" ON points_ledger`,
          `DROP POLICY IF EXISTS "System can award points" ON points_ledger`,
          `CREATE POLICY "Users can view household points" ON points_ledger
           FOR SELECT TO authenticated
           USING (
             member_id IN (
               SELECT id FROM members
               WHERE household_id = public.get_user_household_id()
             )
           )`,
          `CREATE POLICY "System can award points" ON points_ledger
           FOR INSERT TO authenticated
           WITH CHECK (
             member_id IN (
               SELECT id FROM members
               WHERE household_id = public.get_user_household_id()
             )
           )`
        ]
      },
      {
        name: '2️⃣  TASK_PHOTOS - Виправлення дозволів на завантаження',
        severity: 'HIGH',
        commands: [
          `DROP POLICY IF EXISTS "Users can upload photos for tasks they complete" ON task_photos`,
          `DROP POLICY IF EXISTS "task_photos_insert_policy" ON task_photos`,
          `DROP POLICY IF EXISTS "task_photos_select_policy" ON task_photos`,
          `DROP POLICY IF EXISTS "task_photos_delete_policy" ON task_photos`,
          `CREATE POLICY "task_photos_insert_policy" ON task_photos
           FOR INSERT TO authenticated
           WITH CHECK (
             EXISTS (
               SELECT 1 FROM tasks t
               JOIN members m ON m.household_id = t.household_id
               WHERE t.id = task_photos.task_id
               AND m.user_id = auth.uid()
               AND (
                 t.assignee_id = m.id
                 OR m.role = 'admin'
               )
             )
           )`,
          `CREATE POLICY "task_photos_select_policy" ON task_photos
           FOR SELECT TO authenticated
           USING (
             task_id IN (
               SELECT id FROM tasks
               WHERE household_id = public.get_user_household_id()
             )
           )`,
          `CREATE POLICY "task_photos_delete_policy" ON task_photos
           FOR DELETE TO authenticated
           USING (
             EXISTS (
               SELECT 1 FROM members m
               WHERE m.user_id = auth.uid()
               AND m.household_id = public.get_user_household_id()
               AND (
                 task_photos.uploaded_by = m.id
                 OR m.role = 'admin'
               )
             )
           )`
        ]
      },
      {
        name: '3️⃣  RECURRING_TASKS - Додавання WITH CHECK для UPDATE',
        severity: 'MEDIUM',
        commands: [
          `DROP POLICY IF EXISTS "Admins can update recurring tasks" ON recurring_tasks`,
          `DROP POLICY IF EXISTS "recurring_tasks_update_policy" ON recurring_tasks`,
          `CREATE POLICY "recurring_tasks_update_policy" ON recurring_tasks
           FOR UPDATE TO authenticated
           USING (
             EXISTS (
               SELECT 1 FROM members
               WHERE members.household_id = recurring_tasks.household_id
               AND members.user_id = auth.uid()
               AND members.role = 'admin'
             )
           )
           WITH CHECK (
             EXISTS (
               SELECT 1 FROM members
               WHERE members.household_id = recurring_tasks.household_id
               AND members.user_id = auth.uid()
               AND members.role = 'admin'
             )
           )`
        ]
      },
      {
        name: '4️⃣  SUBSCRIPTIONS - Додавання INSERT/UPDATE/DELETE політик',
        severity: 'MEDIUM',
        commands: [
          `ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY`,
          `DROP POLICY IF EXISTS "subscriptions_insert_policy" ON subscriptions`,
          `DROP POLICY IF EXISTS "subscriptions_update_policy" ON subscriptions`,
          `DROP POLICY IF EXISTS "subscriptions_delete_policy" ON subscriptions`,
          `CREATE POLICY "subscriptions_insert_policy" ON subscriptions
           FOR INSERT TO authenticated
           WITH CHECK (
             household_id IN (
               SELECT household_id FROM members
               WHERE user_id = auth.uid()
               AND role = 'admin'
             )
           )`,
          `CREATE POLICY "subscriptions_update_policy" ON subscriptions
           FOR UPDATE TO authenticated
           USING (
             household_id IN (
               SELECT household_id FROM members
               WHERE user_id = auth.uid()
               AND role = 'admin'
             )
           )
           WITH CHECK (
             household_id IN (
               SELECT household_id FROM members
               WHERE user_id = auth.uid()
               AND role = 'admin'
             )
           )`,
          `CREATE POLICY "subscriptions_delete_policy" ON subscriptions
           FOR DELETE TO authenticated
           USING (
             household_id IN (
               SELECT household_id FROM members
               WHERE user_id = auth.uid()
               AND role = 'admin'
             )
           )`
        ]
      }
    ];

    // Виконуємо виправлення
    for (const fix of fixes) {
      console.log(`\n${fix.name}`);
      console.log(`Рівень: ${fix.severity}`);
      console.log(`Команд: ${fix.commands.length}`);

      let success = 0;
      let skipped = 0;
      let failed = 0;

      for (const command of fix.commands) {
        // Визначаємо тип команди для логування
        const cmdType = command.match(/^(ALTER|DROP|CREATE|GRANT)/i)?.[1] || 'CMD';
        const policyMatch = command.match(/POLICY\s+"?([^"\s]+)"?/i);
        const policyName = policyMatch ? policyMatch[1] : '';

        process.stdout.write(`  ${cmdType} ${policyName}... `);

        try {
          await client.query(command);
          console.log('✅');
          success++;
        } catch (err) {
          if (err.message.includes('does not exist') && cmdType === 'DROP') {
            console.log('⏭️  (не існує)');
            skipped++;
          } else if (err.message.includes('already exists')) {
            console.log('⏭️  (вже існує)');
            skipped++;
          } else {
            console.log('❌');
            console.log(`    Помилка: ${err.message}`);
            failed++;
          }
        }
      }

      console.log(`  Результат: ✅ ${success} | ⏭️  ${skipped} | ❌ ${failed}`);
    }

    // Перевірка результатів
    console.log('\n========================================');
    console.log('🔍 ПЕРЕВІРКА РЕЗУЛЬТАТІВ');
    console.log('========================================\n');

    const tables = [
      'points_ledger',
      'task_photos',
      'recurring_tasks',
      'subscriptions'
    ];

    for (const table of tables) {
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM pg_policies
        WHERE tablename = $1
      `, [table]);

      const count = result.rows[0].count;
      const icon = count > 0 ? '✅' : '❌';
      console.log(`${icon} ${table}: ${count} політик`);

      if (count > 0) {
        const policies = await client.query(`
          SELECT cmd, COUNT(*) as cnt
          FROM pg_policies
          WHERE tablename = $1
          GROUP BY cmd
          ORDER BY cmd
        `, [table]);

        policies.rows.forEach(p => {
          const cmdIcon = p.cmd === 'INSERT' ? '➕' :
                         p.cmd === 'SELECT' ? '👁️' :
                         p.cmd === 'UPDATE' ? '✏️' :
                         p.cmd === 'DELETE' ? '🗑️' : '❓';
          console.log(`    ${cmdIcon} ${p.cmd}: ${p.cnt}`);
        });
      }
    }

    console.log('\n========================================');
    console.log('✅ ВИПРАВЛЕННЯ ЗАВЕРШЕНО');
    console.log('========================================\n');

    console.log('📋 ЩО БУЛО ВИПРАВЛЕНО:');
    console.log('  • points_ledger - додано політики для перегляду та нарахування поінтів');
    console.log('  • task_photos - обмежено завантаження фото лише призначеним користувачам');
    console.log('  • recurring_tasks - додано WITH CHECK для UPDATE політики');
    console.log('  • subscriptions - додано політики для управління підписками адмінами');

    console.log('\n💡 ТЕСТУВАННЯ:');
    console.log('  1. Спробуйте додати нового учасника (має працювати)');
    console.log('  2. Перевірте нарахування поінтів за виконання тасків');
    console.log('  3. Спробуйте додати фото до таску (лише призначений або адмін)');
    console.log('  4. Створіть recurring task як адмін');

  } catch (error) {
    console.error('\n❌ КРИТИЧНА ПОМИЛКА:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 З\'єднання закрито');
  }
}

// Запуск
applyCriticalRLSFixes().catch(console.error);