-- ================================================================
-- NON-CRITICAL RLS POLICIES
-- These are not essential for basic functionality but provide
-- complete CRUD coverage for all tables
-- ================================================================

-- ================================
-- HOUSEHOLDS TABLE
-- ================================
-- Admins can delete their household
CREATE POLICY "enable_delete_for_admins_households" ON households
FOR DELETE TO authenticated
USING (
  id IN (
    SELECT m.household_id FROM members m
    WHERE m.user_id = auth.uid() AND m.role = 'admin'
  )
);

-- ================================
-- CLEANING_CAPTAINS TABLE
-- ================================
-- Admins can delete captain weeks
CREATE POLICY "enable_delete_for_admins_captains" ON cleaning_captains
FOR DELETE TO authenticated
USING (
  household_id IN (
    SELECT m.household_id FROM members m
    WHERE m.user_id = auth.uid() AND m.role = 'admin'
  )
);

-- ================================
-- CAPTAIN_RATINGS TABLE
-- ================================
-- Users can delete their own ratings
CREATE POLICY "enable_delete_for_own_ratings" ON captain_ratings
FOR DELETE TO authenticated
USING (rated_by = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1));

-- ================================
-- MEMBER_BADGES TABLE
-- ================================
-- Users can update their badge status (e.g., mark as displayed)
CREATE POLICY "enable_update_for_member_badges" ON member_badges
FOR UPDATE TO authenticated
USING (
  member_id IN (
    SELECT id FROM members WHERE household_id = public.get_user_household_id()
  )
)
WITH CHECK (
  member_id IN (
    SELECT id FROM members WHERE household_id = public.get_user_household_id()
  )
);

-- Admins can delete badges from members
CREATE POLICY "enable_delete_for_admins_member_badges" ON member_badges
FOR DELETE TO authenticated
USING (
  member_id IN (
    SELECT m.id FROM members m
    WHERE m.household_id IN (
      SELECT m2.household_id FROM members m2
      WHERE m2.user_id = auth.uid() AND m2.role = 'admin'
    )
  )
);

-- ✅ NON-CRITICAL POLICIES COMPLETE!
-- All tables now have comprehensive CRUD coverage
