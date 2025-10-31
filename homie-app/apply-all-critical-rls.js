/**
 * Автоматичне застосування ВСІХ критичних виправлень RLS політик
 * Виправляє всі знайдені проблеми з безпекою та дозволами
 */

const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres.ojmmvaoztddrgvthcjit:Kickflip@1080@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

// Кольори для консолі
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function applyAllCriticalRLSFixes() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log(`${colors.cyan}🔌 Підключення до бази даних...${colors.reset}`);
    await client.connect();
    console.log(`${colors.green}✅ Підключено успішно${colors.reset}\n`);

    console.log(`${colors.bright}========================================${colors.reset}`);
    console.log(`${colors.bright}🛡️  ВИПРАВЛЕННЯ КРИТИЧНИХ RLS ПРОБЛЕМ${colors.reset}`);
    console.log(`${colors.bright}========================================${colors.reset}\n`);

    // Таблиці які будемо виправляти
    const tables = [
      { name: 'points_ledger', severity: 'CRITICAL', issue: 'Взагалі немає політик' },
      { name: 'captain_ratings', severity: 'CRITICAL', issue: 'Неправильні поля і немає перевірки household' },
      { name: 'room_notes', severity: 'HIGH', issue: 'Рекурсивний SELECT замість helper функції' },
      { name: 'task_photos', severity: 'HIGH', issue: 'Дозволяє будь-кому додавати фото до непризначених тасків' },
      { name: 'messages', severity: 'CRITICAL', issue: 'Використання LIMIT 1 без ORDER BY' },
      { name: 'recurring_tasks', severity: 'MEDIUM', issue: 'UPDATE без WITH CHECK' },
      { name: 'subscriptions', severity: 'MEDIUM', issue: 'Відсутні INSERT/UPDATE/DELETE політики' }
    ];

    console.log(`${colors.yellow}📋 Таблиці для виправлення:${colors.reset}`);
    tables.forEach(t => {
      const severityColor = t.severity === 'CRITICAL' ? colors.red :
                            t.severity === 'HIGH' ? colors.yellow :
                            colors.blue;
      console.log(`  ${severityColor}[${t.severity}]${colors.reset} ${t.name}: ${t.issue}`);
    });
    console.log();

    // Читаємо SQL файл
    const sqlFile = fs.readFileSync('./FIX-ALL-CRITICAL-RLS.sql', 'utf8');

    // Розділяємо на окремі секції для кожної таблиці
    const sections = sqlFile.split(/-- ============================================================/);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const table of tables) {
      console.log(`\n${colors.cyan}📦 Виправлення ${table.name}...${colors.reset}`);

      // Знаходимо секцію для цієї таблиці
      const tableSection = sections.find(s =>
        s.toLowerCase().includes(table.name.toLowerCase()) &&
        !s.includes('КІНЕЦЬ')
      );

      if (!tableSection) {
        console.log(`  ${colors.yellow}⚠️  Не знайдено виправлень для ${table.name}${colors.reset}`);
        continue;
      }

      // Витягуємо SQL команди
      const commands = tableSection
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd =>
          cmd.length > 0 &&
          !cmd.startsWith('--') &&
          !cmd.startsWith('/*') &&
          (cmd.toUpperCase().includes('DROP') ||
           cmd.toUpperCase().includes('CREATE') ||
           cmd.toUpperCase().includes('ALTER') ||
           cmd.toUpperCase().includes('GRANT'))
        );

      console.log(`  Знайдено ${commands.length} команд`);

      for (const command of commands) {
        // Визначаємо тип команди
        const isDropPolicy = command.toUpperCase().includes('DROP POLICY');
        const isCreatePolicy = command.toUpperCase().includes('CREATE POLICY');
        const isAlterTable = command.toUpperCase().includes('ALTER TABLE');

        // Отримуємо назву політики
        let policyName = '';
        const policyMatch = command.match(/POLICY\s+"?([^"\s]+)"?/i);
        if (policyMatch) {
          policyName = policyMatch[1];
        }

        const commandType = isDropPolicy ? 'DROP' :
                           isCreatePolicy ? 'CREATE' :
                           isAlterTable ? 'ALTER' : 'COMMAND';

        process.stdout.write(`    ${commandType} ${policyName}... `);

        try {
          await client.query(command + ';');
          console.log(`${colors.green}✅${colors.reset}`);
          successCount++;
        } catch (err) {
          if (isDropPolicy && err.message.includes('does not exist')) {
            console.log(`${colors.yellow}⏭️  (не існує)${colors.reset}`);
          } else {
            console.log(`${colors.red}❌${colors.reset}`);
            console.log(`      ${colors.red}Помилка: ${err.message}${colors.reset}`);
            errors.push({ table: table.name, command: commandType, error: err.message });
            errorCount++;
          }
        }
      }
    }

    // Перевірка результатів
    console.log(`\n${colors.cyan}🔍 Перевірка встановлених політик...${colors.reset}`);

    for (const table of tables) {
      const checkPolicies = await client.query(`
        SELECT
          policyname,
          cmd
        FROM pg_policies
        WHERE tablename = $1
        ORDER BY cmd;
      `, [table.name]);

      if (checkPolicies.rows.length > 0) {
        console.log(`\n  ${colors.green}✅ ${table.name}:${colors.reset}`);
        const policies = {};
        checkPolicies.rows.forEach(p => {
          if (!policies[p.cmd]) policies[p.cmd] = 0;
          policies[p.cmd]++;
        });
        Object.entries(policies).forEach(([cmd, count]) => {
          const icon = cmd === 'INSERT' ? '➕' :
                       cmd === 'SELECT' ? '👁️' :
                       cmd === 'UPDATE' ? '✏️' :
                       cmd === 'DELETE' ? '🗑️' : '❓';
          console.log(`     ${icon} ${cmd}: ${count} політик`);
        });
      } else {
        console.log(`\n  ${colors.red}❌ ${table.name}: НЕ ЗНАЙДЕНО ПОЛІТИК${colors.reset}`);
      }
    }

    // Фінальний звіт
    console.log(`\n${colors.bright}========================================${colors.reset}`);
    console.log(`${colors.bright}📊 ЗВІТ ПРО ВИКОНАННЯ${colors.reset}`);
    console.log(`${colors.bright}========================================${colors.reset}\n`);

    console.log(`  ${colors.green}✅ Успішно виконано: ${successCount} команд${colors.reset}`);
    if (errorCount > 0) {
      console.log(`  ${colors.red}❌ Помилок: ${errorCount}${colors.reset}`);
      console.log(`\n${colors.red}Деталі помилок:${colors.reset}`);
      errors.forEach(e => {
        console.log(`  • ${e.table} (${e.command}): ${e.error}`);
      });
    }

    // Рекомендації
    console.log(`\n${colors.yellow}📝 РЕКОМЕНДАЦІЇ:${colors.reset}`);
    console.log('  1. Перевірте що всі функції додатку працюють коректно');
    console.log('  2. Спробуйте додати нового учасника, створити таск, додати фото');
    console.log('  3. Перевірте що поінти нараховуються за виконання тасків');
    console.log('  4. Якщо щось не працює - запустіть verify-all-rls.js для діагностики');

    // Особливі зауваження
    console.log(`\n${colors.magenta}⚠️  ВАЖЛИВО:${colors.reset}`);
    console.log('  • rooms та tasks політики дозволяють ВСІМ членам household створювати записи');
    console.log('  • Якщо потрібно обмежити лише адмінам - розкоментуйте код в FIX-ALL-CRITICAL-RLS.sql');
    console.log('  • points_ledger тепер має політики - поінти мають працювати');

  } catch (error) {
    console.error(`\n${colors.red}❌ КРИТИЧНА ПОМИЛКА:${colors.reset}`, error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log(`\n${colors.cyan}🔌 З'єднання закрито${colors.reset}`);
  }
}

// Запуск
console.log(`${colors.bright}========================================${colors.reset}`);
console.log(`${colors.bright}🛡️  ЗАСТОСУВАННЯ КРИТИЧНИХ RLS ВИПРАВЛЕНЬ${colors.reset}`);
console.log(`${colors.bright}========================================${colors.reset}\n`);

applyAllCriticalRLSFixes().catch(console.error);