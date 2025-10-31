-- ============================================================
-- ВИПРАВЛЕННЯ INFINITE RECURSION В RLS ПОЛІТИКАХ
-- Просто скопіюй весь цей файл і вставте в Supabase SQL Editor!
-- ============================================================

-- 1. Видалити старі проблемні політики
DROP POLICY IF EXISTS "Users can view their household members" ON members;
DROP POLICY IF EXISTS "Users can view household members" ON members;
DROP POLICY IF EXISTS "Users can create members" ON members;
DROP POLICY IF EXISTS "Users can insert members" ON members;
DROP POLICY IF EXISTS "Users can update their own member profile" ON members;
DROP POLICY IF EXISTS "Users can update members" ON members;
DROP POLICY IF EXISTS "Admins can delete members" ON members;
DROP POLICY IF EXISTS "Users can delete members" ON members;

-- 2. Створити функцію в public schema (обходить рекурсію)
CREATE OR REPLACE FUNCTION public.get_user_household_id() RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT household_id FROM members WHERE user_id = auth.uid() LIMIT 1; $$;

-- 3. Створити нові політики БЕЗ рекурсії
CREATE POLICY "enable_insert_for_authenticated_users" ON members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "enable_select_for_household_members" ON members FOR SELECT TO authenticated USING (household_id = public.get_user_household_id() OR user_id = auth.uid());
CREATE POLICY "enable_update_for_own_profile" ON members FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "enable_delete_for_admins" ON members FOR DELETE TO authenticated USING (household_id IN (SELECT m.household_id FROM members m WHERE m.user_id = auth.uid() AND m.role = 'admin') AND user_id != auth.uid());

-- 4. Увімкнути RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
GRANT EXECUTE ON FUNCTION public.get_user_household_id() TO authenticated;

-- ✅ ГОТОВО! Тепер onboarding має працювати без помилок!
