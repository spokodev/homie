-- ================================================================
-- ПОВНЕ ВИПРАВЛЕННЯ RLS ПОЛІТИК ДЛЯ ВСІХ ТАБЛИЦЬ
-- Автоматично згенеровано на основі аудиту
-- ================================================================

-- ================================
-- TASKS TABLE
-- ================================
-- Users can update tasks in their household
CREATE POLICY "enable_update_for_household_tasks" ON tasks
FOR UPDATE TO authenticated
USING (household_id = public.get_user_household_id())
WITH CHECK (household_id = public.get_user_household_id());

-- Users can delete tasks in their household
CREATE POLICY "enable_delete_for_household_tasks" ON tasks
FOR DELETE TO authenticated
USING (household_id = public.get_user_household_id());

-- ================================
-- ROOMS TABLE
-- ================================
-- Users can view rooms in their household
CREATE POLICY "enable_select_for_household_rooms" ON rooms
FOR SELECT TO authenticated
USING (household_id = public.get_user_household_id());

-- Users can create rooms in their household
CREATE POLICY "enable_insert_for_household_rooms" ON rooms
FOR INSERT TO authenticated
WITH CHECK (household_id = public.get_user_household_id());

-- Users can update rooms in their household
CREATE POLICY "enable_update_for_household_rooms" ON rooms
FOR UPDATE TO authenticated
USING (household_id = public.get_user_household_id())
WITH CHECK (household_id = public.get_user_household_id());

-- Admins can delete rooms
CREATE POLICY "enable_delete_for_admins_rooms" ON rooms
FOR DELETE TO authenticated
USING (
  household_id IN (
    SELECT m.household_id FROM members m
    WHERE m.user_id = auth.uid() AND m.role = 'admin'
  )
);

-- ================================
-- ROOM_NOTES TABLE
-- ================================
-- Users can view room notes in their household
CREATE POLICY "enable_select_for_household_room_notes" ON room_notes
FOR SELECT TO authenticated
USING (
  room_id IN (
    SELECT id FROM rooms WHERE household_id = public.get_user_household_id()
  )
);

-- Users can create room notes
CREATE POLICY "enable_insert_for_room_notes" ON room_notes
FOR INSERT TO authenticated
WITH CHECK (
  member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1)
);

-- Users can update their own room notes
CREATE POLICY "enable_update_for_own_room_notes" ON room_notes
FOR UPDATE TO authenticated
USING (member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1))
WITH CHECK (member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1));

-- Users can delete their own room notes
CREATE POLICY "enable_delete_for_own_room_notes" ON room_notes
FOR DELETE TO authenticated
USING (member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1));

-- ================================
-- MESSAGES TABLE
-- ================================
-- Users can update their own messages
CREATE POLICY "enable_update_for_own_messages" ON messages
FOR UPDATE TO authenticated
USING (
  member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
  member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1)
);

-- Users can delete their own messages
CREATE POLICY "enable_delete_for_own_messages" ON messages
FOR DELETE TO authenticated
USING (
  member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1)
);

-- ================================
-- BADGES TABLE (read-only reference data)
-- ================================
-- Everyone can view badges
CREATE POLICY "enable_select_for_all_badges" ON badges
FOR SELECT TO authenticated
USING (true);

-- ================================
-- MEMBER_BADGES TABLE
-- ================================
-- Users can view badges in their household
CREATE POLICY "enable_select_for_household_member_badges" ON member_badges
FOR SELECT TO authenticated
USING (
  member_id IN (
    SELECT id FROM members WHERE household_id = public.get_user_household_id()
  )
);

-- System can insert badges (usually done by triggers/functions)
CREATE POLICY "enable_insert_for_member_badges" ON member_badges
FOR INSERT TO authenticated
WITH CHECK (
  member_id IN (
    SELECT id FROM members WHERE household_id = public.get_user_household_id()
  )
);

-- ================================
-- CLEANING_CAPTAINS TABLE
-- ================================
-- Users can view captains in their household
CREATE POLICY "enable_select_for_household_captains" ON cleaning_captains
FOR SELECT TO authenticated
USING (household_id = public.get_user_household_id());

-- Users can create captain entries
CREATE POLICY "enable_insert_for_captains" ON cleaning_captains
FOR INSERT TO authenticated
WITH CHECK (household_id = public.get_user_household_id());

-- Users can update captain entries
CREATE POLICY "enable_update_for_captains" ON cleaning_captains
FOR UPDATE TO authenticated
USING (household_id = public.get_user_household_id())
WITH CHECK (household_id = public.get_user_household_id());

-- ================================
-- CAPTAIN_RATINGS TABLE
-- ================================
-- Users can view ratings in their household
CREATE POLICY "enable_select_for_household_captain_ratings" ON captain_ratings
FOR SELECT TO authenticated
USING (
  captain_id IN (
    SELECT id FROM cleaning_captains
    WHERE household_id = public.get_user_household_id()
  )
);

-- Users can create ratings
CREATE POLICY "enable_insert_for_captain_ratings" ON captain_ratings
FOR INSERT TO authenticated
WITH CHECK (
  rater_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1)
);

-- Users can update their own ratings
CREATE POLICY "enable_update_for_own_ratings" ON captain_ratings
FOR UPDATE TO authenticated
USING (rater_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1))
WITH CHECK (rater_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1));

-- ✅ ГОТОВО! Всі таблиці мають правильні RLS політики!
