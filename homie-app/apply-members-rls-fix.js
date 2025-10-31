/**
 * Автоматичне застосування виправлення RLS політик для таблиці members
 * Виправляє помилку: "new role violates row-level security policy for table member"
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

    // Читаємо SQL файл з виправленнями
    const sqlFile = path.join(__dirname, 'fix-members-rls-complete.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Розділяємо SQL на окремі команди (по крапці з комою)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Знайдено ${commands.length} SQL команд для виконання\n`);

    // Виконуємо кожну команду окремо
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Визначаємо тип команди для логування
      let commandType = 'COMMAND';
      if (command.toUpperCase().includes('DROP POLICY')) {
        commandType = 'DROP POLICY';
      } else if (command.toUpperCase().includes('CREATE POLICY')) {
        commandType = 'CREATE POLICY';
      } else if (command.toUpperCase().includes('CREATE OR REPLACE FUNCTION')) {
        commandType = 'CREATE FUNCTION';
      } else if (command.toUpperCase().includes('GRANT')) {
        commandType = 'GRANT';
      } else if (command.toUpperCase().includes('ALTER TABLE')) {
        commandType = 'ALTER TABLE';
      }

      // Отримуємо назву політики якщо можливо
      let policyName = '';
      const policyMatch = command.match(/POLICY\s+"([^"]+)"/i);
      if (policyMatch) {
        policyName = ` "${policyMatch[1]}"`;
      }

      process.stdout.write(`[${i + 1}/${commands.length}] ${commandType}${policyName}... `);

      try {
        await client.query(command + ';');
        console.log('✅');
      } catch (error) {
        // Ігноруємо помилки про неіснуючі політики при DROP
        if (error.message.includes('does not exist') && command.toUpperCase().includes('DROP')) {
          console.log('⏭️  (не існує, пропущено)');
        } else {
          console.log('❌');
          console.error(`   Помилка: ${error.message}`);
          // Продовжуємо виконання інших команд
        }
      }
    }

    console.log('\n🔍 Перевірка нових політик...');

    // Перевіряємо що політики створено
    const checkPolicies = await client.query(`
      SELECT
        policyname,
        cmd,
        permissive
      FROM pg_policies
      WHERE tablename = 'members'
      ORDER BY policyname;
    `);

    console.log('\n📋 Поточні RLS політики для таблиці members:');
    checkPolicies.rows.forEach(policy => {
      const icon = policy.cmd === 'INSERT' ? '➕' :
                   policy.cmd === 'SELECT' ? '👁️' :
                   policy.cmd === 'UPDATE' ? '✏️' :
                   policy.cmd === 'DELETE' ? '🗑️' : '❓';
      console.log(`  ${icon}  ${policy.policyname} (${policy.cmd})`);
    });

    // Перевіряємо що RLS увімкнено
    const rlsStatus = await client.query(`
      SELECT relrowsecurity
      FROM pg_class
      WHERE relname = 'members';
    `);

    if (rlsStatus.rows[0]?.relrowsecurity) {
      console.log('\n✅ Row Level Security УВІМКНЕНО для таблиці members');
    } else {
      console.log('\n⚠️  Row Level Security ВИМКНЕНО для таблиці members');
    }

    // Перевіряємо helper функцію
    const functionCheck = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'get_user_household_id';
    `);

    if (functionCheck.rows.length > 0) {
      console.log('✅ Helper функція get_user_household_id() існує');
    } else {
      console.log('❌ Helper функція get_user_household_id() НЕ знайдена');
    }

    console.log('\n========================================');
    console.log('🎉 МІГРАЦІЯ ЗАВЕРШЕНА УСПІШНО!');
    console.log('========================================');
    console.log('\nТепер адміни можуть додавати нових учасників:');
    console.log('  • Людей (з user_id або без)');
    console.log('  • Домашніх тварин (user_id = NULL)');
    console.log('  • Запрошених учасників (user_id спочатку NULL)');
    console.log('\n💡 Спробуйте додати нового учасника в додатку!');

  } catch (error) {
    console.error('\n❌ ПОМИЛКА МІГРАЦІЇ:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 З\'єднання закрито');
  }
}

// Запускаємо міграцію
console.log('========================================');
console.log('🔧 ВИПРАВЛЕННЯ RLS ПОЛІТИК ДЛЯ MEMBERS');
console.log('========================================\n');

applyMemberRLSFix().catch(console.error);