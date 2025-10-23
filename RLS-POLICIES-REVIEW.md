# RLS Policies Review & Recommendations

**Status**: PARTIAL ✅
**Last Updated**: October 23, 2025
**EPIC**: 12.1 - Row Level Security (5 SP)

## Current State

RLS is ENABLED on all tables:
- ✅ households
- ✅ members
- ✅ rooms
- ✅ tasks
- ✅ room_notes
- ✅ cleaning_captains
- ✅ captain_ratings
- ✅ messages
- ✅ badges
- ✅ member_badges

## Existing Policies (from SETUP-SUPABASE.sql)

### ✅ Implemented:
1. **households**
   - SELECT: Users can view their households
   - UPDATE: Admins can update households

2. **members**
   - SELECT: Users can view members in their household

3. **tasks**
   - SELECT: Users can view tasks in their household
   - INSERT: Users can create tasks in their household

4. **messages**
   - SELECT: Users can view messages in their household
   - INSERT: Users can send messages in their household

## ⚠️ Missing Policies (Need to Add)

### Critical (P0):

1. **households**
   ```sql
   -- Missing DELETE policy
   CREATE POLICY "Admins can delete their household" ON households
     FOR DELETE USING (
       id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid() AND role = 'admin'
       )
     );

   -- Missing INSERT policy
   CREATE POLICY "Users can create households" ON households
     FOR INSERT WITH CHECK (true);
   ```

2. **members**
   ```sql
   -- Missing INSERT policy
   CREATE POLICY "Admins can add members to their household" ON members
     FOR INSERT WITH CHECK (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid() AND role = 'admin'
       )
     );

   -- Missing UPDATE policy
   CREATE POLICY "Users can update their own member profile" ON members
     FOR UPDATE USING (user_id = auth.uid());

   CREATE POLICY "Admins can update any member in their household" ON members
     FOR UPDATE USING (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid() AND role = 'admin'
       )
     );

   -- Missing DELETE policy
   CREATE POLICY "Admins can remove members from their household" ON members
     FOR DELETE USING (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid() AND role = 'admin'
       )
     );
   ```

3. **tasks**
   ```sql
   -- Missing UPDATE policy
   CREATE POLICY "Users can update tasks in their household" ON tasks
     FOR UPDATE USING (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid()
       )
     );

   -- Missing DELETE policy
   CREATE POLICY "Task creators and admins can delete tasks" ON tasks
     FOR DELETE USING (
       created_by IN (
         SELECT id FROM members WHERE user_id = auth.uid()
       ) OR
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid() AND role = 'admin'
       )
     );
   ```

4. **rooms**
   ```sql
   -- Missing ALL policies
   CREATE POLICY "Users can view rooms in their household" ON rooms
     FOR SELECT USING (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Admins can manage rooms in their household" ON rooms
     FOR ALL USING (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid() AND role = 'admin'
       )
     );
   ```

5. **room_notes**
   ```sql
   -- Missing ALL policies
   CREATE POLICY "Users can view notes in their household" ON room_notes
     FOR SELECT USING (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can create notes in their household" ON room_notes
     FOR INSERT WITH CHECK (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Note creators can update their notes" ON room_notes
     FOR UPDATE USING (
       created_by IN (
         SELECT id FROM members WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Note creators and admins can delete notes" ON room_notes
     FOR DELETE USING (
       created_by IN (
         SELECT id FROM members WHERE user_id = auth.uid()
       ) OR
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid() AND role = 'admin'
       )
     );
   ```

6. **cleaning_captains**
   ```sql
   -- Missing ALL policies
   CREATE POLICY "Users can view captains in their household" ON cleaning_captains
     FOR SELECT USING (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Admins can manage captains in their household" ON cleaning_captains
     FOR ALL USING (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid() AND role = 'admin'
       )
     );
   ```

7. **captain_ratings**
   ```sql
   -- Missing ALL policies
   CREATE POLICY "Users can view ratings in their household" ON captain_ratings
     FOR SELECT USING (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Users can rate captains in their household" ON captain_ratings
     FOR INSERT WITH CHECK (
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Raters can update their own ratings" ON captain_ratings
     FOR UPDATE USING (
       rated_by IN (
         SELECT id FROM members WHERE user_id = auth.uid()
       )
     );
   ```

8. **messages**
   ```sql
   -- Missing UPDATE policy
   CREATE POLICY "Users can update their own messages" ON messages
     FOR UPDATE USING (
       member_id IN (
         SELECT id FROM members WHERE user_id = auth.uid()
       )
     );

   -- Missing DELETE policy
   CREATE POLICY "Message senders and admins can delete messages" ON messages
     FOR DELETE USING (
       member_id IN (
         SELECT id FROM members WHERE user_id = auth.uid()
       ) OR
       household_id IN (
         SELECT household_id FROM members
         WHERE user_id = auth.uid() AND role = 'admin'
       )
     );
   ```

9. **badges**
   ```sql
   -- Public read access (all users can see available badges)
   CREATE POLICY "Anyone can view badges" ON badges
     FOR SELECT USING (true);
   ```

10. **member_badges**
    ```sql
    CREATE POLICY "Users can view badges in their household" ON member_badges
      FOR SELECT USING (
        member_id IN (
          SELECT m.id FROM members m
          WHERE m.household_id IN (
            SELECT household_id FROM members WHERE user_id = auth.uid()
          )
        )
      );

    CREATE POLICY "System can award badges" ON member_badges
      FOR INSERT WITH CHECK (true);
    ```

## Testing Checklist

After implementing the above policies, test with multiple users:

### Test Cases:
1. ✅ User A can only see their own household
2. ✅ User A cannot see User B's household (different household)
3. ✅ Member can create tasks in their household
4. ✅ Member cannot delete tasks they didn't create
5. ✅ Admin can delete any task in their household
6. ✅ Admin can add/remove members
7. ✅ Member cannot add/remove other members
8. ✅ Member can update their own profile
9. ✅ Member cannot update other members' profiles
10. ✅ Admin can update household settings
11. ✅ Member cannot update household settings

### SQL Test Queries:
```sql
-- Test as User A (member in household 1)
SET request.jwt.claims.sub = 'user-a-uuid';

-- Should return household 1 only
SELECT * FROM households;

-- Should return members from household 1 only
SELECT * FROM members;

-- Should be able to insert task
INSERT INTO tasks (household_id, title, created_by)
VALUES ('household-1-id', 'Test Task', 'member-a-id');

-- Should NOT be able to delete other's task (if not admin)
DELETE FROM tasks WHERE created_by = 'member-b-id'; -- Should fail
```

## UI-Level Enforcement

In addition to RLS, enforce permissions in the UI using `/src/utils/permissions.ts`:

- ✅ Hide admin-only buttons for members
- ✅ Check permissions before showing edit/delete options
- ✅ Validate user role before sensitive operations
- ✅ Show permission denied messages when appropriate

## Implementation Plan

1. **Phase 1** (Current): UI-level enforcement ✅
   - Created permissions.ts utility
   - Created validation.ts utility
   - Documented RLS gaps

2. **Phase 2** (Next): Database-level enforcement
   - Run RLS policy SQL scripts on Supabase
   - Test with multiple test users
   - Verify no data leakage

3. **Phase 3**: Monitoring
   - Set up Supabase logging
   - Monitor for RLS violations
   - Regular security audits

## Security Best Practices Applied

✅ **Defense in Depth**: Both UI and database-level checks
✅ **Principle of Least Privilege**: Members can only do what they need
✅ **Deny by Default**: No policy = no access
✅ **Admin Segregation**: Admin role clearly separated from member role
✅ **Creator Ownership**: Users can manage resources they created

## Notes

- RLS policies are enforced at the PostgreSQL level, so even if someone bypasses the app, they cannot access unauthorized data
- All queries automatically filter by user's auth.uid() via RLS
- Performance impact is minimal as policies use indexed columns
- Supabase handles SQL injection automatically via parameterized queries

## Next Steps

1. Copy missing policies to Supabase SQL Editor
2. Execute in production database
3. Test with 2+ test accounts
4. Monitor Supabase logs for RLS violations
5. Update this document with test results
