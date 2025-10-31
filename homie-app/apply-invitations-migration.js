/**
 * Застосування міграції для системи запрошень
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres.ojmmvaoztddrgvthcjit:Kickflip@1080@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function applyInvitationsMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Підключення до бази даних...');
    await client.connect();
    console.log('✅ Підключено успішно\n');

    console.log('========================================');
    console.log('🎫 СТВОРЕННЯ СИСТЕМИ ЗАПРОШЕНЬ');
    console.log('========================================\n');

    // Читаємо SQL файл
    const sqlFile = path.join(__dirname, 'migrations', 'create-invitations-table.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Розділяємо на окремі команди
    const commands = sqlContent
      .split(/;(?=\s*(--|CREATE|ALTER|DROP|GRANT|INSERT|UPDATE|DELETE|$))/)
      .map(cmd => cmd.trim())
      .filter(cmd =>
        cmd.length > 0 &&
        !cmd.startsWith('--') &&
        !cmd.match(/^--\s*=+/)
      );

    console.log(`📝 Знайдено ${commands.length} SQL команд\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      // Визначаємо тип команди
      let commandType = 'COMMAND';
      if (command.match(/CREATE TABLE/i)) {
        commandType = 'CREATE TABLE';
      } else if (command.match(/CREATE INDEX/i)) {
        commandType = 'CREATE INDEX';
      } else if (command.match(/CREATE.*FUNCTION/i)) {
        commandType = 'CREATE FUNCTION';
      } else if (command.match(/CREATE POLICY/i)) {
        commandType = 'CREATE POLICY';
      } else if (command.match(/ALTER TABLE/i)) {
        commandType = 'ALTER TABLE';
      } else if (command.match(/GRANT/i)) {
        commandType = 'GRANT';
      }

      // Отримуємо назву об'єкта
      let objectName = '';
      const tableMatch = command.match(/TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
      const functionMatch = command.match(/FUNCTION\s+(\w+)/i);
      const policyMatch = command.match(/POLICY\s+"([^"]+)"/i);
      const indexMatch = command.match(/INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);

      if (tableMatch) objectName = tableMatch[1];
      else if (functionMatch) objectName = functionMatch[1];
      else if (policyMatch) objectName = policyMatch[1];
      else if (indexMatch) objectName = indexMatch[1];

      process.stdout.write(`[${i + 1}/${commands.length}] ${commandType} ${objectName}... `);

      try {
        await client.query(command + ';');
        console.log('✅');
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⏭️  (вже існує)');
        } else if (error.message.includes('does not exist') && command.includes('DROP')) {
          console.log('⏭️  (не існує)');
        } else {
          console.log('❌');
          console.error(`   Помилка: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n========================================');
    console.log('🔍 ПЕРЕВІРКА РЕЗУЛЬТАТІВ');
    console.log('========================================\n');

    // Перевірка що таблиця створена
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'invitations'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Таблиця invitations створена');

      // Перевірка структури
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'invitations'
        ORDER BY ordinal_position;
      `);

      console.log('\n📊 Структура таблиці:');
      columns.rows.forEach(col => {
        console.log(`  • ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });

      // Перевірка політик
      const policies = await client.query(`
        SELECT policyname, cmd
        FROM pg_policies
        WHERE tablename = 'invitations'
        ORDER BY policyname;
      `);

      console.log('\n🛡️  RLS політики:');
      if (policies.rows.length > 0) {
        policies.rows.forEach(p => {
          const icon = p.cmd === 'INSERT' ? '➕' :
                       p.cmd === 'SELECT' ? '👁️' :
                       p.cmd === 'UPDATE' ? '✏️' :
                       p.cmd === 'DELETE' ? '🗑️' : '❓';
          console.log(`  ${icon} ${p.policyname}`);
        });
      } else {
        console.log('  ❌ Політики не знайдено');
      }

      // Перевірка функцій
      const functions = await client.query(`
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name IN ('generate_invite_code', 'claim_invitation', 'cleanup_expired_invitations');
      `);

      console.log('\n🔧 Функції:');
      functions.rows.forEach(f => {
        console.log(`  ✅ ${f.routine_name}()`);
      });

    } else {
      console.log('❌ Таблиця invitations НЕ створена');
    }

    console.log('\n========================================');
    console.log('📊 ПІДСУМОК');
    console.log('========================================\n');

    console.log(`✅ Успішно виконано: ${successCount} команд`);
    if (errorCount > 0) {
      console.log(`❌ Помилок: ${errorCount}`);
    }

    console.log('\n🎉 СИСТЕМА ЗАПРОШЕНЬ ГОТОВА!');
    console.log('\nТепер можна:');
    console.log('  • Генерувати коди запрошень при додаванні членів');
    console.log('  • Нові користувачі можуть приєднуватися за кодом');
    console.log('  • Адміни можуть управляти запрошеннями');

  } catch (error) {
    console.error('\n❌ КРИТИЧНА ПОМИЛКА:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 З\'єднання закрито');
  }
}

// Запуск
console.log('========================================');
console.log('🎫 МІГРАЦІЯ: СИСТЕМА ЗАПРОШЕНЬ');
console.log('========================================\n');

applyInvitationsMigration().catch(console.error);