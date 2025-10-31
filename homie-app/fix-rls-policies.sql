-- ====================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- Виправлення безкінечної рекурсії в RLS політиках
-- ====================================

-- Крок 1: Видалити всі існуючі політики на таблиці members
DROP POLICY IF EXISTS "Users can view their household members" ON members;
DROP POLICY IF EXISTS "Users can view household members" ON members;
DROP POLICY IF EXISTS "Users can create members" ON members;
DROP POLICY IF EXISTS "Users can insert members" ON members;
DROP POLICY IF EXISTS "Users can update their own member profile" ON members;
DROP POLICY IF EXISTS "Users can update members" ON members;
DROP POLICY IF EXISTS "Admins can delete members" ON members;
DROP POLICY IF EXISTS "Users can delete members" ON members;

-- Крок 2: Створити функцію для отримання household_id користувача (обходить RLS)
CREATE OR REPLACE FUNCTION auth.get_user_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT household_id
  FROM members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Крок 3: Створити ПРАВИЛЬНІ RLS політики без рекурсії

-- Політика для INSERT (створення нового member при onboarding)
CREATE POLICY "enable_insert_for_authenticated_users"
ON members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Дозволяємо створити member, якщо user_id відповідає поточному користувачу
  user_id = auth.uid()
);

-- Політика для SELECT (читання members)
CREATE POLICY "enable_select_for_household_members"
ON members
FOR SELECT
TO authenticated
USING (
  -- Користувач може бачити всіх членів свого household
  household_id = auth.get_user_household_id()
  OR
  -- АБО користувач може бачити самого себе (для першого onboarding)
  user_id = auth.uid()
);

-- Політика для UPDATE (оновлення профілю)
CREATE POLICY "enable_update_for_own_profile"
ON members
FOR UPDATE
TO authenticated
USING (
  -- Користувач може оновлювати тільки свій власний профіль
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Політика для DELETE (видалення members - тільки для адмінів)
CREATE POLICY "enable_delete_for_admins"
ON members
FOR DELETE
TO authenticated
USING (
  -- Перевіряємо, що поточний користувач є адміном в тому ж household
  household_id IN (
    SELECT m.household_id
    FROM members m
    WHERE m.user_id = auth.uid()
    AND m.role = 'admin'
  )
  AND
  -- Не дозволяємо видалити самого себе
  user_id != auth.uid()
);

-- Крок 4: Переконатися, що RLS увімкнено
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Крок 5: Дати дозвіл на виконання функції
GRANT EXECUTE ON FUNCTION auth.get_user_household_id() TO authenticated;

-- Готово! ✅
-- Тепер можна тестувати onboarding в додатку
