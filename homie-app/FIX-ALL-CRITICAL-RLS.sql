-- ============================================================
-- КРИТИЧНІ ВИПРАВЛЕННЯ RLS ПОЛІТИК ДЛЯ ВСІХ ТАБЛИЦЬ
-- Виправляє всі знайдені проблеми з Row Level Security
-- ============================================================
-- Створено: 2025-10-27
-- Автор: Claude
-- ============================================================

-- ============================================================
-- 1. POINTS_LEDGER - КРИТИЧНА ПРОБЛЕМА: Взагалі немає політик
-- ============================================================
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;

-- Видалити старі політики якщо є
DROP POLICY IF EXISTS "Users can view household points" ON points_ledger;
DROP POLICY IF EXISTS "System can award points" ON points_ledger;
DROP POLICY IF EXISTS "Users can view their points" ON points_ledger;

-- Користувачі можуть бачити всі поінти в їх household
CREATE POLICY "Users can view household points" ON points_ledger
FOR SELECT TO authenticated
USING (
  member_id IN (
    SELECT id FROM members
    WHERE household_id = public.get_user_household_id()
  )
);

-- Система може додавати поінти (для тригерів і автоматизації)
CREATE POLICY "System can award points" ON points_ledger
FOR INSERT TO authenticated, service_role
WITH CHECK (
  member_id IN (
    SELECT id FROM members
    WHERE household_id = public.get_user_household_id()
  )
);

-- ============================================================
-- 2. CAPTAIN_RATINGS - КРИТИЧНА: Неправильні поля і немає перевірки household
-- ============================================================

-- Видалити старі проблемні політики
DROP POLICY IF EXISTS "enable_insert_for_captain_ratings" ON captain_ratings;
DROP POLICY IF EXISTS "enable_delete_for_own_ratings" ON captain_ratings;
DROP POLICY IF EXISTS "enable_update_for_own_ratings" ON captain_ratings;

-- INSERT: Перевірка що капітан в тому ж household
CREATE POLICY "captain_ratings_insert_policy" ON captain_ratings
FOR INSERT TO authenticated
WITH CHECK (
  -- Перевірка що капітан в тому ж household що і користувач
  EXISTS (
    SELECT 1 FROM cleaning_captains cc
    JOIN members m ON cc.household_id = m.household_id
    WHERE cc.id = captain_id
    AND m.user_id = auth.uid()
  )
  AND
  -- Рейтинг від поточного member
  rater_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- UPDATE: Користувач може оновити лише власні рейтинги
CREATE POLICY "captain_ratings_update_policy" ON captain_ratings
FOR UPDATE TO authenticated
USING (
  rater_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  rater_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- DELETE: Користувач може видалити лише власні рейтинги
CREATE POLICY "captain_ratings_delete_policy" ON captain_ratings
FOR DELETE TO authenticated
USING (
  rater_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- ============================================================
-- 3. ROOM_NOTES - ВИСОКИЙ РИЗИК: Рекурсивний SELECT замість helper функції
-- ============================================================

DROP POLICY IF EXISTS "enable_insert_for_room_notes" ON room_notes;
DROP POLICY IF EXISTS "enable_select_for_room_notes" ON room_notes;
DROP POLICY IF EXISTS "enable_update_for_own_notes" ON room_notes;
DROP POLICY IF EXISTS "enable_delete_for_own_notes" ON room_notes;

-- INSERT: Використання helper функції замість LIMIT 1
CREATE POLICY "room_notes_insert_policy" ON room_notes
FOR INSERT TO authenticated
WITH CHECK (
  -- Перевірка що кімната в household користувача
  room_id IN (
    SELECT id FROM rooms
    WHERE household_id = public.get_user_household_id()
  )
  AND
  -- Member ID правильний для користувача
  member_id IN (
    SELECT id FROM members
    WHERE user_id = auth.uid()
    AND household_id = public.get_user_household_id()
  )
);

-- SELECT: Бачити нотатки свого household
CREATE POLICY "room_notes_select_policy" ON room_notes
FOR SELECT TO authenticated
USING (
  room_id IN (
    SELECT id FROM rooms
    WHERE household_id = public.get_user_household_id()
  )
);

-- UPDATE: Оновлювати власні нотатки
CREATE POLICY "room_notes_update_policy" ON room_notes
FOR UPDATE TO authenticated
USING (
  member_id IN (
    SELECT id FROM members
    WHERE user_id = auth.uid()
    AND household_id = public.get_user_household_id()
  )
)
WITH CHECK (
  member_id IN (
    SELECT id FROM members
    WHERE user_id = auth.uid()
    AND household_id = public.get_user_household_id()
  )
);

-- DELETE: Видаляти власні нотатки
CREATE POLICY "room_notes_delete_policy" ON room_notes
FOR DELETE TO authenticated
USING (
  member_id IN (
    SELECT id FROM members
    WHERE user_id = auth.uid()
    AND household_id = public.get_user_household_id()
  )
);

-- ============================================================
-- 4. TASK_PHOTOS - ВИСОКИЙ РИЗИК: Дозволяє будь-кому додавати фото до непризначених тасків
-- ============================================================

DROP POLICY IF EXISTS "Users can upload photos for tasks they complete" ON task_photos;
DROP POLICY IF EXISTS "Users can view task photos in their household" ON task_photos;
DROP POLICY IF EXISTS "Users can delete their own task photos" ON task_photos;

-- INSERT: Тільки призначений користувач або адмін може додати фото
CREATE POLICY "task_photos_insert_policy" ON task_photos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN members m ON m.household_id = t.household_id
    WHERE t.id = task_photos.task_id
    AND m.user_id = auth.uid()
    AND (
      -- Таск призначений цьому member
      t.assignee_id = m.id
      OR
      -- Або member є адміном
      m.role = 'admin'
      OR
      -- Або це recurring task instance призначена цьому member
      EXISTS (
        SELECT 1 FROM recurring_task_instances rti
        WHERE rti.task_id = t.id
        AND rti.assignee_id = m.id
      )
    )
  )
);

-- SELECT: Бачити фото тасків свого household
CREATE POLICY "task_photos_select_policy" ON task_photos
FOR SELECT TO authenticated
USING (
  task_id IN (
    SELECT id FROM tasks
    WHERE household_id = public.get_user_household_id()
  )
);

-- DELETE: Видаляти власні фото або якщо адмін
CREATE POLICY "task_photos_delete_policy" ON task_photos
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM members m
    WHERE m.user_id = auth.uid()
    AND m.household_id = public.get_user_household_id()
    AND (
      -- Власне фото (uploaded_by)
      task_photos.uploaded_by = m.id
      OR
      -- Або адмін
      m.role = 'admin'
    )
  )
);

-- ============================================================
-- 5. MESSAGES - КРИТИЧНА: Використання LIMIT 1 без ORDER BY
-- ============================================================

DROP POLICY IF EXISTS "enable_insert_for_messages" ON messages;
DROP POLICY IF EXISTS "enable_select_for_household_messages" ON messages;
DROP POLICY IF EXISTS "enable_update_for_own_messages" ON messages;
DROP POLICY IF EXISTS "enable_delete_for_own_messages" ON messages;

-- INSERT: Використання helper функції
CREATE POLICY "messages_insert_policy" ON messages
FOR INSERT TO authenticated
WITH CHECK (
  household_id = public.get_user_household_id()
  AND
  member_id IN (
    SELECT id FROM members
    WHERE user_id = auth.uid()
    AND household_id = public.get_user_household_id()
  )
);

-- SELECT: Бачити повідомлення свого household
CREATE POLICY "messages_select_policy" ON messages
FOR SELECT TO authenticated
USING (
  household_id = public.get_user_household_id()
);

-- UPDATE: Оновлювати власні повідомлення
CREATE POLICY "messages_update_policy" ON messages
FOR UPDATE TO authenticated
USING (
  member_id IN (
    SELECT id FROM members
    WHERE user_id = auth.uid()
    AND household_id = public.get_user_household_id()
  )
)
WITH CHECK (
  member_id IN (
    SELECT id FROM members
    WHERE user_id = auth.uid()
    AND household_id = public.get_user_household_id()
  )
);

-- DELETE: Видаляти власні повідомлення або якщо адмін
CREATE POLICY "messages_delete_policy" ON messages
FOR DELETE TO authenticated
USING (
  member_id IN (
    SELECT id FROM members
    WHERE user_id = auth.uid()
    AND household_id = public.get_user_household_id()
  )
  OR
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND household_id = public.get_user_household_id()
    AND role = 'admin'
  )
);

-- ============================================================
-- 6. RECURRING_TASKS - СЕРЕДНІЙ РИЗИК: UPDATE без WITH CHECK
-- ============================================================

DROP POLICY IF EXISTS "Admins can update recurring tasks" ON recurring_tasks;

-- UPDATE: Додати WITH CHECK clause
CREATE POLICY "recurring_tasks_update_policy" ON recurring_tasks
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
);

-- ============================================================
-- 7. SUBSCRIPTIONS - СЕРЕДНІЙ РИЗИК: Відсутні INSERT/UPDATE/DELETE політики
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can create subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON subscriptions;

-- INSERT: Тільки адміни можуть створювати підписки
CREATE POLICY "subscriptions_insert_policy" ON subscriptions
FOR INSERT TO authenticated
WITH CHECK (
  household_id IN (
    SELECT household_id FROM members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- UPDATE: Тільки адміни можуть оновлювати підписки
CREATE POLICY "subscriptions_update_policy" ON subscriptions
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
);

-- DELETE: Тільки адміни можуть видаляти підписки
CREATE POLICY "subscriptions_delete_policy" ON subscriptions
FOR DELETE TO authenticated
USING (
  household_id IN (
    SELECT household_id FROM members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================
-- 8. ROOMS - Документувати поточну модель дозволів
-- ============================================================
-- УВАГА: Поточна політика дозволяє БУДЬ-ЯКОМУ члену household створювати кімнати
-- Якщо потрібно обмежити лише адмінам, розкоментуйте наступний код:

-- DROP POLICY IF EXISTS "enable_insert_for_household_rooms" ON rooms;
-- CREATE POLICY "rooms_admin_insert_policy" ON rooms
-- FOR INSERT TO authenticated
-- WITH CHECK (
--   household_id IN (
--     SELECT household_id FROM members
--     WHERE user_id = auth.uid()
--     AND role = 'admin'
--   )
-- );

-- ============================================================
-- 9. TASKS - Документувати поточну модель дозволів
-- ============================================================
-- УВАГА: Поточна політика дозволяє БУДЬ-ЯКОМУ члену household створювати таски
-- Якщо потрібно обмежити лише адмінам, розкоментуйте наступний код:

-- DROP POLICY IF EXISTS "Users can create tasks in their household" ON tasks;
-- CREATE POLICY "tasks_admin_insert_policy" ON tasks
-- FOR INSERT TO authenticated
-- WITH CHECK (
--   household_id IN (
--     SELECT household_id FROM members
--     WHERE user_id = auth.uid()
--     AND role = 'admin'
--   )
-- );

-- ============================================================
-- КІНЕЦЬ КРИТИЧНИХ ВИПРАВЛЕНЬ
-- ============================================================

-- Перевірка результатів (запустіть окремо для перегляду):
/*
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename IN (
  'points_ledger',
  'captain_ratings',
  'room_notes',
  'task_photos',
  'messages',
  'recurring_tasks',
  'subscriptions'
)
ORDER BY tablename, cmd;
*/