/**
 * Пряме застосування міграції системи запрошень
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.ojmmvaoztddrgvthcjit:Kickflip@1080@aws-1-eu-west-1.pooler.supabase.com:6543/postgres';

async function applyInvitationsDirect() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Підключення до бази даних...');
    await client.connect();
    console.log('✅ Підключено\n');

    console.log('📦 1. Створення таблиці invitations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        member_id UUID REFERENCES members(id) ON DELETE CASCADE,
        invite_code VARCHAR(8) UNIQUE NOT NULL,
        email VARCHAR(255),
        member_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'cancelled')),
        invited_by UUID NOT NULL REFERENCES members(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
        claimed_at TIMESTAMP WITH TIME ZONE,
        claimed_by UUID REFERENCES auth.users(id),
        CONSTRAINT valid_dates CHECK (expires_at > created_at),
        CONSTRAINT claimed_validation CHECK (
          (status = 'claimed' AND claimed_at IS NOT NULL AND claimed_by IS NOT NULL) OR
          (status != 'claimed' AND claimed_at IS NULL AND claimed_by IS NULL)
        )
      )
    `);
    console.log('✅ Таблиця створена\n');

    console.log('📇 2. Створення індексів...');
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_invitations_invite_code ON invitations(invite_code) WHERE status = 'pending'`,
      `CREATE INDEX IF NOT EXISTS idx_invitations_household_id ON invitations(household_id)`,
      `CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status)`,
      `CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at) WHERE status = 'pending'`
    ];

    for (const idx of indexes) {
      await client.query(idx);
      process.stdout.write('.');
    }
    console.log(' ✅\n');

    console.log('🎲 3. Створення функції generate_invite_code()...');
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_invite_code()
      RETURNS VARCHAR(8)
      LANGUAGE plpgsql
      AS $$
      DECLARE
        chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        result VARCHAR(8) := '';
        i INTEGER;
        attempts INTEGER := 0;
      BEGIN
        LOOP
          result := '';
          FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
          END LOOP;
          EXIT WHEN NOT EXISTS (SELECT 1 FROM invitations WHERE invite_code = result);
          attempts := attempts + 1;
          IF attempts > 100 THEN
            RAISE EXCEPTION 'Could not generate unique invite code';
          END IF;
        END LOOP;
        RETURN result;
      END;
      $$
    `);
    console.log('✅ Функція створена\n');

    console.log('🎫 4. Створення функції claim_invitation()...');
    await client.query(`
      CREATE OR REPLACE FUNCTION claim_invitation(
        p_invite_code VARCHAR(8),
        p_user_id UUID
      )
      RETURNS TABLE(
        success BOOLEAN,
        message TEXT,
        household_id UUID,
        member_id UUID
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_invitation RECORD;
        v_member_id UUID;
      BEGIN
        SELECT * INTO v_invitation
        FROM invitations
        WHERE invite_code = p_invite_code
          AND status = 'pending'
          AND expires_at > NOW()
        FOR UPDATE;

        IF NOT FOUND THEN
          RETURN QUERY SELECT
            FALSE,
            'Запрошення не знайдено або вже використано'::TEXT,
            NULL::UUID,
            NULL::UUID;
          RETURN;
        END IF;

        IF EXISTS (
          SELECT 1 FROM members
          WHERE user_id = p_user_id
          AND household_id = v_invitation.household_id
        ) THEN
          RETURN QUERY SELECT
            FALSE,
            'Ви вже є членом цієї сім''ї'::TEXT,
            v_invitation.household_id,
            NULL::UUID;
          RETURN;
        END IF;

        IF v_invitation.member_id IS NOT NULL THEN
          UPDATE members
          SET user_id = p_user_id
          WHERE id = v_invitation.member_id
            AND user_id IS NULL;
          v_member_id := v_invitation.member_id;
        ELSE
          INSERT INTO members (
            household_id,
            user_id,
            name,
            avatar,
            type,
            role,
            points,
            level,
            streak_days
          ) VALUES (
            v_invitation.household_id,
            p_user_id,
            v_invitation.member_name,
            '😊',
            'human',
            'member',
            0,
            1,
            0
          ) RETURNING id INTO v_member_id;
        END IF;

        UPDATE invitations
        SET
          status = 'claimed',
          claimed_at = NOW(),
          claimed_by = p_user_id
        WHERE id = v_invitation.id;

        RETURN QUERY SELECT
          TRUE,
          'Успішно приєднано до сім''ї'::TEXT,
          v_invitation.household_id,
          v_member_id;
      END;
      $$
    `);
    console.log('✅ Функція створена\n');

    console.log('🧹 5. Створення функції cleanup_expired_invitations()...');
    await client.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
      RETURNS INTEGER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        UPDATE invitations
        SET status = 'expired'
        WHERE status = 'pending'
          AND expires_at < NOW();
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$
    `);
    console.log('✅ Функція створена\n');

    console.log('🛡️  6. Налаштування RLS політик...');
    await client.query(`ALTER TABLE invitations ENABLE ROW LEVEL SECURITY`);

    const policies = [
      {
        name: 'Admins can view household invitations',
        sql: `CREATE POLICY "Admins can view household invitations" ON invitations
              FOR SELECT TO authenticated
              USING (
                household_id IN (
                  SELECT m.household_id
                  FROM members m
                  WHERE m.user_id = auth.uid()
                  AND m.role = 'admin'
                )
              )`
      },
      {
        name: 'Anyone can view pending invitations by code',
        sql: `CREATE POLICY "Anyone can view pending invitations by code" ON invitations
              FOR SELECT TO authenticated
              USING (status = 'pending' AND expires_at > NOW())`
      },
      {
        name: 'Admins can create invitations',
        sql: `CREATE POLICY "Admins can create invitations" ON invitations
              FOR INSERT TO authenticated
              WITH CHECK (
                household_id IN (
                  SELECT m.household_id
                  FROM members m
                  WHERE m.user_id = auth.uid()
                  AND m.role = 'admin'
                )
                AND invited_by IN (
                  SELECT id FROM members WHERE user_id = auth.uid()
                )
              )`
      },
      {
        name: 'Admins can update invitations',
        sql: `CREATE POLICY "Admins can update invitations" ON invitations
              FOR UPDATE TO authenticated
              USING (
                household_id IN (
                  SELECT m.household_id
                  FROM members m
                  WHERE m.user_id = auth.uid()
                  AND m.role = 'admin'
                )
              )
              WITH CHECK (
                household_id IN (
                  SELECT m.household_id
                  FROM members m
                  WHERE m.user_id = auth.uid()
                  AND m.role = 'admin'
                )
              )`
      },
      {
        name: 'Admins can delete invitations',
        sql: `CREATE POLICY "Admins can delete invitations" ON invitations
              FOR DELETE TO authenticated
              USING (
                household_id IN (
                  SELECT m.household_id
                  FROM members m
                  WHERE m.user_id = auth.uid()
                  AND m.role = 'admin'
                )
              )`
      }
    ];

    for (const policy of policies) {
      try {
        await client.query(policy.sql);
        console.log(`  ✅ ${policy.name}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ⏭️  ${policy.name} (вже існує)`);
        } else {
          console.log(`  ❌ ${policy.name}: ${err.message}`);
        }
      }
    }

    console.log('\n🔑 7. Надання дозволів на функції...');
    await client.query(`GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated`);
    await client.query(`GRANT EXECUTE ON FUNCTION claim_invitation(VARCHAR, UUID) TO authenticated`);
    await client.query(`GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO service_role`);
    console.log('✅ Дозволи надані\n');

    // Перевірка
    console.log('🔍 Перевірка системи запрошень...\n');

    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'invitations'
      )
    `);

    if (tableExists.rows[0].exists) {
      console.log('✅ Таблиця invitations створена');

      // Тест генерації коду
      const testCode = await client.query(`SELECT generate_invite_code() as code`);
      console.log(`✅ Тест генерації коду: ${testCode.rows[0].code}`);

      // Перевірка політик
      const policyCount = await client.query(`
        SELECT COUNT(*) FROM pg_policies WHERE tablename = 'invitations'
      `);
      console.log(`✅ RLS політик створено: ${policyCount.rows[0].count}`);
    }

    console.log('\n========================================');
    console.log('🎉 СИСТЕМА ЗАПРОШЕНЬ УСПІШНО ВСТАНОВЛЕНА!');
    console.log('========================================\n');
    console.log('Тепер можна:');
    console.log('  • Генерувати коди при додаванні членів');
    console.log('  • Запрошувати нових користувачів');
    console.log('  • Приєднуватися до сім\'ї за кодом');

  } catch (error) {
    console.error('\n❌ Помилка:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 З\'єднання закрито');
  }
}

applyInvitationsDirect().catch(console.error);