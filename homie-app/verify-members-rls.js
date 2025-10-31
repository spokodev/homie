/**
 * Перевірка що RLS політики для members працюють коректно
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.ojmmvaoztddrgvthcjit:Kickflip@1080@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function verifyMembersRLS() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Підключення до бази даних...\n');
    await client.connect();

    console.log('========================================');
    console.log('📊 ПЕРЕВІРКА RLS ПОЛІТИК ДЛЯ MEMBERS');
    console.log('========================================\n');

    // 1. Перевіряємо статус RLS
    const rlsStatus = await client.query(`
      SELECT
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled
      FROM pg_class c
      WHERE c.relname = 'members';
    `);

    console.log('1️⃣  Статус Row Level Security:');
    if (rlsStatus.rows[0]?.rls_enabled) {
      console.log('   ✅ RLS УВІМКНЕНО для таблиці members\n');
    } else {
      console.log('   ❌ RLS ВИМКНЕНО для таблиці members\n');
    }

    // 2. Перевіряємо helper функцію
    const functionExists = await client.query(`
      SELECT
        routine_name,
        routine_type,
        security_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'get_user_household_id';
    `);

    console.log('2️⃣  Helper функція:');
    if (functionExists.rows.length > 0) {
      const func = functionExists.rows[0];
      console.log(`   ✅ Функція get_user_household_id() існує`);
      console.log(`      Security: ${func.security_type}\n`);
    } else {
      console.log('   ❌ Функція get_user_household_id() НЕ ЗНАЙДЕНА\n');
    }

    // 3. Перевіряємо всі політики
    const policies = await client.query(`
      SELECT
        policyname,
        cmd,
        permissive,
        roles,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename = 'members'
      ORDER BY cmd, policyname;
    `);

    console.log('3️⃣  Встановлені RLS політики:');
    console.log('   Знайдено політик:', policies.rows.length, '\n');

    const policyTypes = {
      'INSERT': { icon: '➕', found: false },
      'SELECT': { icon: '👁️', found: false },
      'UPDATE': { icon: '✏️', found: false },
      'DELETE': { icon: '🗑️', found: false }
    };

    policies.rows.forEach(policy => {
      policyTypes[policy.cmd].found = true;
      console.log(`   ${policyTypes[policy.cmd].icon} ${policy.policyname}`);
      console.log(`      Command: ${policy.cmd}`);
      console.log(`      Roles: ${Array.isArray(policy.roles) ? policy.roles.join(', ') : policy.roles}`);

      // Показуємо короткий опис умов
      if (policy.cmd === 'INSERT') {
        console.log(`      Умова: Власний профіль АБО адмін household`);
      } else if (policy.cmd === 'SELECT') {
        console.log(`      Умова: Учасники свого household`);
      } else if (policy.cmd === 'UPDATE') {
        if (policy.policyname.includes('own')) {
          console.log(`      Умова: Тільки власний профіль`);
        } else {
          console.log(`      Умова: Адміни оновлюють інших`);
        }
      } else if (policy.cmd === 'DELETE') {
        console.log(`      Умова: Адміни видаляють (крім себе)`);
      }
      console.log();
    });

    // Перевірка що всі типи політик присутні
    console.log('4️⃣  Перевірка повноти політик:');
    let allPoliciesPresent = true;
    for (const [cmd, data] of Object.entries(policyTypes)) {
      if (!data.found) {
        console.log(`   ❌ Відсутня політика для ${cmd}`);
        allPoliciesPresent = false;
      }
    }
    if (allPoliciesPresent) {
      console.log('   ✅ Всі необхідні типи політик присутні\n');
    }

    // 5. Перевіряємо критичну INSERT політику
    const insertPolicy = policies.rows.find(p => p.cmd === 'INSERT');
    if (insertPolicy) {
      console.log('5️⃣  Аналіз INSERT політики (критична для додавання):');

      // Перевіряємо чи дозволяє адмінам додавати
      if (insertPolicy.with_check && insertPolicy.with_check.includes('role') && insertPolicy.with_check.includes('admin')) {
        console.log('   ✅ Адміни МОЖУТЬ додавати учасників');
      } else if (insertPolicy.with_check && insertPolicy.with_check.includes('OR')) {
        console.log('   ✅ Політика має альтернативні умови (OR)');
      } else {
        console.log('   ⚠️  Політика може бути занадто обмеженою');
      }

      // Показуємо умову WITH CHECK
      console.log('\n   WITH CHECK умова (спрощено):');
      if (insertPolicy.with_check.includes('auth.uid()') && insertPolicy.with_check.includes('OR')) {
        console.log('   • user_id = auth.uid() (власний профіль)');
        console.log('   • АБО адмін household (додавання інших)');
      }
    }

    // 6. Статистика members
    console.log('\n6️⃣  Статистика таблиці members:');
    const stats = await client.query(`
      SELECT
        COUNT(*) as total_members,
        COUNT(DISTINCT household_id) as total_households,
        COUNT(CASE WHEN type = 'pet' THEN 1 END) as pets,
        COUNT(CASE WHEN type = 'human' THEN 1 END) as humans,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN user_id IS NULL THEN 1 END) as without_user_id
      FROM members;
    `);

    const s = stats.rows[0];
    console.log(`   Всього учасників: ${s.total_members}`);
    console.log(`   Households: ${s.total_households}`);
    console.log(`   Людей: ${s.humans} (адмінів: ${s.admins})`);
    console.log(`   Тварин: ${s.pets}`);
    console.log(`   Без user_id: ${s.without_user_id}`);

    console.log('\n========================================');
    console.log('📋 РЕЗУЛЬТАТ ПЕРЕВІРКИ');
    console.log('========================================\n');

    if (rlsStatus.rows[0]?.rls_enabled &&
        functionExists.rows.length > 0 &&
        allPoliciesPresent &&
        insertPolicy) {
      console.log('✅ RLS НАЛАШТОВАНО КОРЕКТНО!');
      console.log('\nВи можете:');
      console.log('• Додавати нових учасників як адмін');
      console.log('• Додавати домашніх тварин (pets)');
      console.log('• Запрошувати людей до household');
    } else {
      console.log('⚠️  Знайдено проблеми з RLS!');
      console.log('\nРекомендації:');
      console.log('• Запустіть apply-members-fix-v2.js знову');
      console.log('• Перевірте логи на помилки');
    }

  } catch (error) {
    console.error('❌ Помилка перевірки:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 З\'єднання закрито');
  }
}

// Запуск
verifyMembersRLS().catch(console.error);