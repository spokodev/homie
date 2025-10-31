-- ============================================================
-- СТВОРЕННЯ СИСТЕМИ ЗАПРОШЕНЬ ДЛЯ HOMIELIFE
-- Дозволяє новим користувачам приєднуватися до існуючих сімей
-- ============================================================

-- 1. Створення таблиці invitations
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

  -- Індекси для швидкого пошуку
  CONSTRAINT valid_dates CHECK (expires_at > created_at),
  CONSTRAINT claimed_validation CHECK (
    (status = 'claimed' AND claimed_at IS NOT NULL AND claimed_by IS NOT NULL) OR
    (status != 'claimed' AND claimed_at IS NULL AND claimed_by IS NULL)
  )
);

-- Індекси для оптимізації
CREATE INDEX idx_invitations_invite_code ON invitations(invite_code) WHERE status = 'pending';
CREATE INDEX idx_invitations_household_id ON invitations(household_id);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at) WHERE status = 'pending';

-- 2. Функція для генерації унікального коду запрошення
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
    -- Генеруємо 6-значний код (легше передавати)
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Перевіряємо унікальність
    EXIT WHEN NOT EXISTS (SELECT 1 FROM invitations WHERE invite_code = result);

    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique invite code';
    END IF;
  END LOOP;

  RETURN result;
END;
$$;

-- 3. Функція для claim запрошення
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
  -- Знайти активне запрошення
  SELECT * INTO v_invitation
  FROM invitations
  WHERE invite_code = p_invite_code
    AND status = 'pending'
    AND expires_at > NOW()
  FOR UPDATE;

  -- Перевірка чи знайдено
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE,
      'Запрошення не знайдено або вже використано'::TEXT,
      NULL::UUID,
      NULL::UUID;
    RETURN;
  END IF;

  -- Перевірка чи користувач вже є членом цієї сім'ї
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

  -- Якщо member_id вказано - оновити існуючий member запис
  IF v_invitation.member_id IS NOT NULL THEN
    UPDATE members
    SET user_id = p_user_id
    WHERE id = v_invitation.member_id
      AND user_id IS NULL;

    v_member_id := v_invitation.member_id;
  ELSE
    -- Створити новий member запис
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

  -- Оновити статус запрошення
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
$$;

-- 4. RLS політики для invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Адміни можуть бачити всі запрошення своєї сім'ї
CREATE POLICY "Admins can view household invitations" ON invitations
  FOR SELECT
  TO authenticated
  USING (
    household_id IN (
      SELECT m.household_id
      FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- Всі можуть бачити активні запрошення за кодом (для перевірки)
CREATE POLICY "Anyone can view pending invitations by code" ON invitations
  FOR SELECT
  TO authenticated
  USING (status = 'pending' AND expires_at > NOW());

-- Адміни можуть створювати запрошення
CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IN (
      SELECT m.household_id
      FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
    )
    AND
    invited_by IN (
      SELECT id
      FROM members
      WHERE user_id = auth.uid()
    )
  );

-- Адміни можуть оновлювати запрошення (скасовувати)
CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE
  TO authenticated
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
  );

-- Адміни можуть видаляти запрошення
CREATE POLICY "Admins can delete invitations" ON invitations
  FOR DELETE
  TO authenticated
  USING (
    household_id IN (
      SELECT m.household_id
      FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- 5. Функція для автоматичного видалення старих запрошень (можна запускати cron)
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
$$;

-- Дозволи на функції
GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_invitation(VARCHAR, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations() TO service_role;

-- ============================================================
-- МІГРАЦІЯ ЗАВЕРШЕНА
-- Тепер можна запрошувати нових членів до сім'ї!
-- ============================================================