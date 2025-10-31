-- ============================================================
-- ПОВНЕ ВИПРАВЛЕННЯ RLS ПОЛІТИК ДЛЯ ТАБЛИЦІ MEMBERS
-- Виправляє помилку: "new role violates row-level security policy for table member"
-- ============================================================

-- 1. ВИДАЛИТИ ВСІ СТАРІ ПОЛІТИКИ
-- ============================================================
DROP POLICY IF EXISTS "Users can view their household members" ON members;
DROP POLICY IF EXISTS "Users can view household members" ON members;
DROP POLICY IF EXISTS "Users can create members" ON members;
DROP POLICY IF EXISTS "Users can insert members" ON members;
DROP POLICY IF EXISTS "Users can update their own member profile" ON members;
DROP POLICY IF EXISTS "Users can update members" ON members;
DROP POLICY IF EXISTS "Admins can delete members" ON members;
DROP POLICY IF EXISTS "Users can delete members" ON members;
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON members;
DROP POLICY IF EXISTS "enable_select_for_household_members" ON members;
DROP POLICY IF EXISTS "enable_update_for_own_profile" ON members;
DROP POLICY IF EXISTS "enable_update_for_admin_members" ON members;
DROP POLICY IF EXISTS "enable_delete_for_admins" ON members;

-- 2. СТВОРИТИ HELPER ФУНКЦІЮ (якщо ще не існує)
-- ============================================================
-- Ця функція уникає infinite recursion в RLS політиках
CREATE OR REPLACE FUNCTION public.get_user_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id
  FROM members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Дати дозвіл на виконання функції
GRANT EXECUTE ON FUNCTION public.get_user_household_id() TO authenticated;

-- 3. СТВОРИТИ НОВІ RLS ПОЛІТИКИ
-- ============================================================

-- INSERT: Дозволити створення учасників
-- Включає: власний профіль, адміни можуть додавати учасників, домашніх тварин
CREATE POLICY "members_insert_policy" ON members
FOR INSERT TO authenticated
WITH CHECK (
  -- Варіант 1: Користувач створює власний member запис при onboarding
  user_id = auth.uid()
  OR
  -- Варіант 2: Адмін додає нового учасника (людину або тварину) до свого household
  (
    household_id IN (
      SELECT m.household_id
      FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  )
);

-- SELECT: Дозволити перегляд учасників свого household
CREATE POLICY "members_select_policy" ON members
FOR SELECT TO authenticated
USING (
  -- Використовуємо helper функцію щоб уникнути рекурсії
  household_id = public.get_user_household_id()
  OR
  -- Або це власний запис користувача
  user_id = auth.uid()
);

-- UPDATE: Користувачі можуть оновлювати власний профіль
CREATE POLICY "members_update_own_policy" ON members
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- UPDATE: Адміни можуть оновлювати будь-якого учасника в їх household
CREATE POLICY "members_update_admin_policy" ON members
FOR UPDATE TO authenticated
USING (
  -- Перевіряємо що користувач є адміном в цьому household
  household_id IN (
    SELECT m.household_id
    FROM members m
    WHERE m.user_id = auth.uid()
    AND m.role = 'admin'
  )
  -- І це не власний профіль (вже покрито іншою політикою)
  AND user_id != auth.uid()
)
WITH CHECK (
  -- Ті самі умови для WITH CHECK
  household_id IN (
    SELECT m.household_id
    FROM members m
    WHERE m.user_id = auth.uid()
    AND m.role = 'admin'
  )
  AND user_id != auth.uid()
);

-- DELETE: Тільки адміни можуть видаляти учасників (крім себе)
CREATE POLICY "members_delete_admin_policy" ON members
FOR DELETE TO authenticated
USING (
  -- Перевіряємо що користувач є адміном в цьому household
  household_id IN (
    SELECT m.household_id
    FROM members m
    WHERE m.user_id = auth.uid()
    AND m.role = 'admin'
  )
  -- І це не власний профіль (адмін не може видалити себе)
  AND user_id != auth.uid()
);

-- 4. УВІМКНУТИ RLS
-- ============================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 5. НАДАТИ НЕОБХІДНІ ДОЗВОЛИ
-- ============================================================
GRANT ALL ON members TO authenticated;

-- ============================================================
-- ГОТОВО! Тепер адміни можуть додавати нових учасників і тварин
-- ============================================================

-- Перевірка політик (опціонально):
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'members'
-- ORDER BY policyname;