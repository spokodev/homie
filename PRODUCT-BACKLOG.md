# 📊 HomieLife - Product Backlog
**Version**: 1.0
**Last Updated**: 23 жовтня 2025
**Product Owner**: YourName
**Scrum Master**: YourName

---

## 📈 Executive Summary

**Current MVP Status**: 40% Complete

| Category | Status | Completion |
|----------|--------|------------|
| Infrastructure | ✅ Ready | 90% |
| UI Screens | 🟡 Partial | 50% |
| Backend Integration | ❌ Needed | 5% |
| Core Features | ❌ Needed | 15% |
| Premium Features | ✅ Ready | 95% |

**Velocity**: Estimated 20-25 SP per 2-week sprint
**Team Size**: 1-2 developers
**Target MVP**: 3-4 sprints (6-8 weeks)

---

## 🎯 Product Vision

HomieLife - перетворює рутинні домашні справи на захоплюючу сімейну гру з системою балів, досягнень та ротацією "Капітана Чистоти".

**Target Users**: Сім'ї з 2-6 членами, середній вік 25-45
**Core Value**: Gamification + справедливий розподіл домашніх обов'язків

---

## 📋 Backlog Structure

- **Total EPICs**: 15
- **Total User Stories**: 108
- **Total Story Points**: 387 SP
- **Estimated Effort**: ~290 hours

### Priority Levels:
- **P0 (Critical)**: MVP blockers - must have for basic functionality
- **P1 (High)**: Core features - essential for good UX
- **P2 (Medium)**: Important features - enhance user experience
- **P3 (Low)**: Nice-to-have - can be deferred
- **P4 (Future)**: Future enhancements - backlog items

---

# 🚀 EPIC 1: Authentication & User Management
**Priority**: P0 (Critical - MVP Blocker)
**Total Story Points**: 21 SP
**Sprint**: Sprint 1
**Business Value**: Users cannot access app without auth

## User Stories

### 1.1 Supabase Auth - Login Integration
**Story Points**: 3
**Priority**: P0
**As a** user
**I want** to log in with my email and password
**So that** I can access my household data securely

**Acceptance Criteria**:
- [ ] User can enter email and password
- [ ] System validates credentials with Supabase
- [ ] Successful login redirects to Home screen
- [ ] Failed login shows error message
- [ ] Session is persisted with SecureStore
- [ ] Loading state shown during auth

**Technical Tasks**:
1. Import `auth` from `/src/lib/supabase.ts`
2. Replace TODO in `login.tsx` line 48
3. Call `auth.signIn(email, password)`
4. Handle success: navigate to `/(tabs)/home`
5. Handle errors: display user-friendly message
6. Store session token in SecureStore
7. Add loading spinner during API call

**Dependencies**: None
**Estimated Hours**: 2-3 hours

---

### 1.2 Supabase Auth - Signup Integration
**Story Points**: 3
**Priority**: P0
**As a** new user
**I want** to create an account
**So that** I can start using HomieLife

**Acceptance Criteria**:
- [ ] User can enter name, email, password, confirm password
- [ ] Password must be 8+ characters
- [ ] Passwords must match
- [ ] Email must be valid format
- [ ] Successful signup creates user in Supabase
- [ ] User automatically logged in after signup
- [ ] Redirect to onboarding flow after signup

**Technical Tasks**:
1. Replace TODO in `signup.tsx` line 67
2. Call `auth.signUp(email, password, { data: { name } })`
3. Validate all form fields
4. Handle "email already exists" error
5. Store user metadata (name) in Supabase
6. Navigate to onboarding after success
7. Add loading state

**Dependencies**: 1.1
**Estimated Hours**: 2-3 hours

---

### 1.3 Auth Context Provider
**Story Points**: 5
**Priority**: P0
**As a** developer
**I want** global auth state management
**So that** all screens can access current user

**Acceptance Criteria**:
- [ ] Create AuthContext with React Context API
- [ ] Provide: `user`, `session`, `isAuthenticated`, `isLoading`
- [ ] Methods: `login()`, `logout()`, `signup()`
- [ ] Wrap app with AuthProvider in `_layout.tsx`
- [ ] Auto-restore session on app launch
- [ ] Handle session expiry gracefully

**Technical Tasks**:
1. Create `/src/context/AuthContext.tsx`
2. Use `supabase.auth.getSession()` on mount
3. Listen to `supabase.auth.onAuthStateChange()`
4. Store current user state
5. Provide auth methods to all components
6. Wrap `<Stack>` with `<AuthProvider>` in `app/_layout.tsx`

**Dependencies**: 1.1, 1.2
**Estimated Hours**: 3-4 hours

---

### 1.4 Protected Routes Middleware
**Story Points**: 3
**Priority**: P0
**As a** system
**I want** to protect authenticated routes
**So that** unauthorized users cannot access private screens

**Acceptance Criteria**:
- [ ] Redirect to login if not authenticated
- [ ] Allow access to (auth) routes when not logged in
- [ ] Prevent access to (tabs) without auth
- [ ] Preserve intended route after login
- [ ] Show loading screen while checking auth

**Technical Tasks**:
1. Create `/src/middleware/auth.middleware.tsx`
2. Check `isAuthenticated` from AuthContext
3. Use Expo Router redirect
4. Implement in `app/(tabs)/_layout.tsx`
5. Save redirect path before login
6. Navigate to saved path after auth

**Dependencies**: 1.3
**Estimated Hours**: 2 hours

---

### 1.5 Logout Functionality
**Story Points**: 2
**Priority**: P0
**As a** user
**I want** to log out
**So that** I can protect my privacy

**Acceptance Criteria**:
- [ ] Logout button in Profile screen
- [ ] Clear session from SecureStore
- [ ] Clear all app state (Zustand stores)
- [ ] Redirect to Welcome screen
- [ ] Show confirmation dialog

**Technical Tasks**:
1. Add logout button in `app/(tabs)/profile.tsx`
2. Call `auth.signOut()`
3. Clear AuthContext state
4. Clear all Zustand stores
5. Navigate to `/` (welcome)
6. Add confirmation Alert

**Dependencies**: 1.3
**Estimated Hours**: 1-2 hours

---

### 1.6 Password Reset Flow
**Story Points**: 5
**Priority**: P1
**As a** user who forgot password
**I want** to reset it via email
**So that** I can regain access to my account

**Acceptance Criteria**:
- [ ] "Forgot Password" link on login screen
- [ ] Forgot password screen with email input
- [ ] Send reset email via Supabase
- [ ] User receives email with reset link
- [ ] Reset link opens app to new password screen
- [ ] User can set new password
- [ ] Success message and redirect to login

**Technical Tasks**:
1. Create `/app/(auth)/forgot-password.tsx`
2. Call `auth.resetPassword(email)`
3. Configure Supabase email template
4. Set up deep link: `homie://reset-password`
5. Create password reset screen
6. Update password in Supabase
7. Show success toast

**Dependencies**: 1.1, 1.3
**Estimated Hours**: 3-4 hours

---

# 🎯 EPIC 2: Task Management (Core Feature)
**Priority**: P0 (Critical)
**Total Story Points**: 31 SP
**Sprint**: Sprint 1-2
**Business Value**: Main app functionality

## User Stories

### 2.1 Create Task Screen & Flow
**Story Points**: 8
**Priority**: P0
**As a** household member
**I want** to create a new task
**So that** it appears in the task list

**Acceptance Criteria**:
- [ ] FAB button on Home opens "Create Task" modal
- [ ] Form fields: Title (required), Description, Room, Assignee, Due Date, Estimated Time
- [ ] Select room from dropdown
- [ ] Assign to member or leave unassigned
- [ ] Points auto-calculated based on time estimate
- [ ] Save button inserts task into Supabase
- [ ] Task appears in Home screen task list
- [ ] Close modal on success

**Technical Tasks**:
1. Create `/app/(modals)/create-task.tsx`
2. Build form with all fields
3. Create `useTasks` hook
4. Implement `createTask(data)` mutation
5. Insert into `tasks` table via Supabase
6. Calculate points: `Math.ceil(estimatedMinutes / 5)`
7. Invalidate React Query cache
8. Close modal and show success toast
9. Update Stack to include modal route

**Dependencies**: 1.3 (need auth context for created_by)
**Estimated Hours**: 5-6 hours

---

### 2.2 List Tasks on Home Screen
**Story Points**: 5
**Priority**: P0
**As a** user
**I want** to see my assigned tasks
**So that** I know what to do today

**Acceptance Criteria**:
- [ ] Fetch tasks from Supabase for current household
- [ ] Filter: tasks assigned to me or unassigned
- [ ] Show task title, room, due time, points
- [ ] Order by: due date ASC
- [ ] Pull-to-refresh functionality
- [ ] Empty state if no tasks
- [ ] Loading skeleton while fetching

**Technical Tasks**:
1. Create `/src/hooks/useTasks.ts`
2. Use React Query: `useQuery('tasks', fetchTasks)`
3. Query Supabase:
   ```sql
   SELECT * FROM tasks
   WHERE household_id = ? AND status != 'completed'
   AND (assignee_id = ? OR assignee_id IS NULL)
   ORDER BY due_date ASC
   ```
4. Replace dummy data in `app/(tabs)/home.tsx`
5. Map API data to UI
6. Add RefreshControl
7. Show loading spinner

**Dependencies**: 1.3, 2.1
**Estimated Hours**: 3-4 hours

---

### 2.3 Task Details Screen
**Story Points**: 5
**Priority**: P1
**As a** user
**I want** to view task details
**So that** I can see full information

**Acceptance Criteria**:
- [ ] Tap task card navigates to details
- [ ] Show: Title, Description, Room, Assignee, Creator, Due Date, Estimated Time, Points, Status
- [ ] Edit button (if creator or household admin)
- [ ] Delete button (if creator or admin)
- [ ] "Mark Complete" button
- [ ] "Start Task" button (changes status to in_progress)

**Technical Tasks**:
1. Create `/app/(modals)/task-details.tsx`
2. Accept task ID as route param
3. Fetch task by ID from Supabase
4. Display all fields
5. Implement "Mark Complete" (mutation)
6. Implement "Delete" with confirmation
7. Add navigation to edit screen

**Dependencies**: 2.2
**Estimated Hours**: 3-4 hours

---

### 2.4 Edit Task
**Story Points**: 5
**Priority**: P1
**As a** task creator
**I want** to edit task details
**So that** I can fix mistakes or update info

**Acceptance Criteria**:
- [ ] Pre-fill form with current task data
- [ ] Allow editing all fields except creator
- [ ] Save updates to Supabase
- [ ] Show success message
- [ ] Reflect changes immediately in task list

**Technical Tasks**:
1. Create `/app/(modals)/edit-task.tsx` (reuse create-task form)
2. Fetch task data by ID
3. Pre-populate form fields
4. Implement `updateTask(id, data)` mutation
5. Update Supabase `tasks` table
6. Invalidate React Query cache
7. Navigate back on success

**Dependencies**: 2.3
**Estimated Hours**: 3 hours

---

### 2.5 Complete Task Flow
**Story Points**: 5
**Priority**: P0
**As a** user
**I want** to mark task as complete
**So that** I earn points

**Acceptance Criteria**:
- [ ] "Mark Complete" button on task details
- [ ] Optional: Enter actual time spent
- [ ] Update task status to 'completed'
- [ ] Award points to assignee
- [ ] Update member's points in database
- [ ] Show "+X points earned!" animation
- [ ] Task removed from active list
- [ ] Check for level-up (100 points = 1 level)

**Technical Tasks**:
1. Add "Complete Task" modal with time entry
2. Update task: `status = 'completed', completed_at = NOW(), actual_minutes = X`
3. Trigger Supabase function or edge function to:
   - Add points to member
   - Check badges earned
   - Check level-up
4. Show success animation
5. Update local state optimistically
6. Invalidate queries

**Dependencies**: 2.3, Points System
**Estimated Hours**: 4 hours

---

### 2.6 Delete Task
**Story Points**: 2
**Priority**: P1
**As a** task creator or admin
**I want** to delete a task
**So that** I can remove mistakes

**Acceptance Criteria**:
- [ ] Delete button in task details (only for creator/admin)
- [ ] Confirmation dialog: "Are you sure?"
- [ ] Soft delete or hard delete from Supabase
- [ ] Remove from UI immediately
- [ ] Cannot delete completed tasks (archive instead)

**Technical Tasks**:
1. Add delete button in task details
2. Show Alert confirmation
3. Call `deleteTask(id)` mutation
4. Delete from Supabase or set `deleted_at` timestamp
5. Navigate back to Home
6. Update cache

**Dependencies**: 2.3
**Estimated Hours**: 1-2 hours

---

### 2.7 Task Assignment
**Story Points**: 3
**Priority**: P1
**As a** household admin
**I want** to assign tasks to members
**So that** everyone knows their responsibilities

**Acceptance Criteria**:
- [ ] Dropdown to select assignee when creating task
- [ ] Can reassign existing task
- [ ] Shows member avatar and name
- [ ] Can leave unassigned (null assignee)
- [ ] Assigned member gets notification (future)

**Technical Tasks**:
1. Fetch household members from Supabase
2. Create dropdown component
3. Update `assignee_id` in task
4. Show assigned member in task card
5. Filter: "My Tasks" vs "All Tasks"

**Dependencies**: 2.1, Household Members
**Estimated Hours**: 2 hours

---

# 🏠 EPIC 3: Household & Member Management
**Priority**: P0 (Critical)
**Total Story Points**: 26 SP
**Sprint**: Sprint 1-2

## User Stories

### 3.1 Onboarding - Create Household
**Story Points**: 5
**Priority**: P0
**As a** new user after signup
**I want** to create my first household
**So that** I can start using the app

**Acceptance Criteria**:
- [ ] Shown automatically after signup (if no household)
- [ ] Enter household name (default: "{FirstName}'s Home")
- [ ] Choose household icon (emoji picker or preset list)
- [ ] Create household in Supabase
- [ ] Auto-add current user as admin member
- [ ] Navigate to Home screen

**Technical Tasks**:
1. Create `/app/(auth)/onboarding.tsx`
2. Form: household name + icon picker
3. Insert into `households` table
4. Insert creator into `members` table with role='admin'
5. Store household_id in AsyncStorage
6. Navigate to `/(tabs)/home`

**Dependencies**: 1.2 (signup)
**Estimated Hours**: 3-4 hours

---

### 3.2 Add Family Members
**Story Points**: 5
**Priority**: P0
**As a** household admin
**I want** to add family members
**So that** we can share tasks

**Acceptance Criteria**:
- [ ] "Add Member" button in Profile/Settings
- [ ] Form: Name, Avatar (emoji), Type (human/pet), Role (member/admin)
- [ ] Members can be added without email (kids, pets)
- [ ] Insert into `members` table
- [ ] Show all members in household
- [ ] Can edit/delete members (admin only)

**Technical Tasks**:
1. Create `/app/(modals)/add-member.tsx`
2. Form with name, avatar picker, type selector
3. Insert into Supabase `members` table
4. Link to household_id
5. List members in Profile screen
6. CRUD operations for members

**Dependencies**: 3.1
**Estimated Hours**: 3-4 hours

---

### 3.3 Invite Members via Email (Optional)
**Story Points**: 8
**Priority**: P2
**As a** household admin
**I want** to invite members via email
**So that** they can join with their own accounts

**Acceptance Criteria**:
- [ ] "Invite via Email" option
- [ ] Enter email address
- [ ] Send invite email with join link
- [ ] Link opens app to join flow
- [ ] Invitee creates account or logs in
- [ ] Automatically joins household
- [ ] Bonus points for inviter (viral feature)

**Technical Tasks**:
1. Create invite system (Supabase function or API)
2. Generate unique invite token
3. Send email via Supabase/SendGrid
4. Deep link: `homie://join/{token}`
5. Verify token and add member
6. Award 100 points to inviter

**Dependencies**: 3.2, Email service
**Estimated Hours**: 6 hours

---

### 3.4 Household Settings
**Story Points**: 3
**Priority**: P1
**As a** household admin
**I want** to manage household settings
**So that** I can customize the experience

**Acceptance Criteria**:
- [ ] Household name (editable)
- [ ] Household icon (editable)
- [ ] Member list (view/add/remove)
- [ ] Leave household option
- [ ] Delete household (admin only, with confirmation)

**Technical Tasks**:
1. Create settings screen (under Profile tab)
2. Edit household name/icon
3. Update Supabase `households` table
4. Leave household (remove member)
5. Delete household (cascade delete)

**Dependencies**: 3.1, 3.2
**Estimated Hours**: 2 hours

---

### 3.5 Switch Between Households (Premium)
**Story Points**: 5
**Priority**: P3
**As a** premium user with multiple households
**I want** to switch between them
**So that** I can manage multiple homes

**Acceptance Criteria**:
- [ ] Only available for premium users
- [ ] Dropdown in header to select household
- [ ] Load tasks/data for selected household
- [ ] Remember last selected household
- [ ] Free users limited to 1 household

**Technical Tasks**:
1. Check premium status
2. Fetch all households for user
3. Dropdown component
4. Update current household context
5. Refetch all data for new household

**Dependencies**: 3.1, Premium system
**Estimated Hours**: 3 hours

---

# 🎨 EPIC 4: Component Library & Design System
**Priority**: P1 (High - DX)
**Total Story Points**: 21 SP
**Sprint**: Sprint 2

## User Stories

### 4.1 Button Components
**Story Points**: 3
**Priority**: P1
**As a** developer
**I want** reusable button components
**So that** UI is consistent

**Acceptance Criteria**:
- [ ] PrimaryButton (coral red)
- [ ] SecondaryButton (teal)
- [ ] OutlineButton
- [ ] TextButton
- [ ] All support: loading, disabled states
- [ ] Support icons (left/right)
- [ ] Accessible (screen reader labels)

**Technical Tasks**:
1. Create `/src/components/Button/PrimaryButton.tsx`
2. Create `/src/components/Button/SecondaryButton.tsx`
3. Create `/src/components/Button/OutlineButton.tsx`
4. Props: onPress, title, loading, disabled, icon
5. Use theme colors
6. Add proper TypeScript types

**Estimated Hours**: 2 hours

---

### 4.2 Form Input Components
**Story Points**: 5
**Priority**: P1
**As a** developer
**I want** reusable form inputs
**So that** forms are consistent

**Acceptance Criteria**:
- [ ] TextInput with label
- [ ] TextArea (multiline)
- [ ] DatePicker
- [ ] Dropdown/Select
- [ ] All show validation errors
- [ ] Support required, disabled states

**Technical Tasks**:
1. Create `/src/components/Form/TextInput.tsx`
2. Create `/src/components/Form/TextArea.tsx`
3. Create `/src/components/Form/DatePicker.tsx`
4. Create `/src/components/Form/Dropdown.tsx`
5. Common props: value, onChange, error, label, required

**Estimated Hours**: 4 hours

---

### 4.3 Card Components
**Story Points**: 3
**Priority**: P1
**As a** developer
**I want** reusable card components
**So that** content is well-structured

**Acceptance Criteria**:
- [ ] TaskCard (for task lists)
- [ ] MemberCard (for member lists)
- [ ] StatCard (for stats display)
- [ ] BaseCard (generic container)
- [ ] Support onPress for interactive cards

**Technical Tasks**:
1. Create `/src/components/Card/TaskCard.tsx`
2. Create `/src/components/Card/MemberCard.tsx`
3. Create `/src/components/Card/StatCard.tsx`
4. Apply shadows, border-radius from theme
5. TypeScript interfaces for props

**Estimated Hours**: 2 hours

---

### 4.4 Modal & Dialog System
**Story Points**: 5
**Priority**: P1
**As a** developer
**I want** reusable modal/dialog components
**So that** popups are consistent

**Acceptance Criteria**:
- [ ] BottomSheet modal
- [ ] Alert/Confirmation dialog
- [ ] ActionSheet (iOS-style)
- [ ] Toast/Snackbar notifications
- [ ] Backdrop with dismiss

**Technical Tasks**:
1. Create `/src/components/Modal/BottomSheet.tsx`
2. Create `/src/components/Modal/ConfirmDialog.tsx`
3. Create `/src/components/Toast/Toast.tsx`
4. Use react-native-reanimated for animations
5. Dismissable via backdrop or close button

**Estimated Hours**: 4 hours

---

### 4.5 Avatar & Icon Components
**Story Points**: 2
**Priority**: P2
**As a** developer
**I want** avatar and icon components
**So that** user representation is consistent

**Acceptance Criteria**:
- [ ] Avatar component (emoji or image)
- [ ] Fallback to initials if no image
- [ ] Different sizes: small, medium, large
- [ ] Badge overlay (for online status, etc.)

**Technical Tasks**:
1. Create `/src/components/Avatar/Avatar.tsx`
2. Support emoji or image URL
3. Circular shape with border
4. Size variants

**Estimated Hours**: 1-2 hours

---

### 4.6 Empty State & Loading Components
**Story Points**: 3
**Priority**: P2
**As a** developer
**I want** empty state and loading components
**So that** users understand when no data exists

**Acceptance Criteria**:
- [ ] EmptyState (illustration + message + CTA)
- [ ] LoadingSkeleton (for task list, etc.)
- [ ] LoadingSpinner
- [ ] ErrorState (with retry button)

**Technical Tasks**:
1. Create `/src/components/EmptyState/EmptyState.tsx`
2. Create `/src/components/Loading/Skeleton.tsx`
3. Create `/src/components/Loading/Spinner.tsx`
4. Create `/src/components/Error/ErrorState.tsx`

**Estimated Hours**: 2 hours

---

# 📊 EPIC 5: Data Layer & State Management
**Priority**: P0 (Critical)
**Total Story Points**: 26 SP
**Sprint**: Sprint 1-2

## User Stories

### 5.1 React Query Setup & Hooks
**Story Points**: 8
**Priority**: P0
**As a** developer
**I want** React Query hooks for all data
**So that** server state is well managed

**Acceptance Criteria**:
- [ ] useTasks - fetch, create, update, delete
- [ ] useHouseholds - fetch, create, update
- [ ] useMembers - fetch, create, update, delete
- [ ] useMessages - fetch, send (for chat)
- [ ] Optimistic updates on mutations
- [ ] Auto-refetch on focus
- [ ] Cache invalidation strategy

**Technical Tasks**:
1. Create `/src/hooks/useTasks.ts`
2. Create `/src/hooks/useHouseholds.ts`
3. Create `/src/hooks/useMembers.ts`
4. Implement useQuery for fetches
5. Implement useMutation for create/update/delete
6. Configure React Query devtools

**Estimated Hours**: 6 hours

---

### 5.2 Zustand Stores for Client State
**Story Points**: 5
**Priority**: P1
**As a** developer
**I want** Zustand stores for app state
**So that** UI state is managed centrally

**Acceptance Criteria**:
- [ ] useAuthStore - current user, session
- [ ] useUIStore - modals, toasts, sheets
- [ ] useHouseholdStore - selected household
- [ ] All persist to AsyncStorage where needed

**Technical Tasks**:
1. Create `/src/stores/auth.store.ts`
2. Create `/src/stores/ui.store.ts`
3. Create `/src/stores/household.store.ts`
4. Configure persistence with AsyncStorage
5. Integrate with React Query

**Estimated Hours**: 3 hours

---

### 5.3 Real-time Subscriptions
**Story Points**: 8
**Priority**: P2
**As a** user
**I want** real-time updates
**So that** I see changes instantly

**Acceptance Criteria**:
- [ ] Subscribe to task changes in current household
- [ ] Subscribe to new messages in chat
- [ ] Subscribe to member changes
- [ ] Auto-update UI when data changes
- [ ] Handle reconnection gracefully

**Technical Tasks**:
1. Use Supabase Realtime subscriptions
2. Subscribe to `tasks` table changes
3. Subscribe to `messages` table
4. Invalidate React Query cache on change
5. Handle connection errors

**Estimated Hours**: 5-6 hours

---

### 5.4 Error Handling & Retry Logic
**Story Points**: 3
**Priority**: P1
**As a** user
**I want** graceful error handling
**So that** app doesn't crash

**Acceptance Criteria**:
- [ ] Show user-friendly error messages
- [ ] Retry failed requests automatically (3x)
- [ ] Offline mode detection
- [ ] "No internet" banner
- [ ] Queue mutations when offline (optional)

**Technical Tasks**:
1. Configure React Query retry logic
2. Create error boundary components
3. Create `/src/utils/errorHandler.ts`
4. Use NetInfo for offline detection
5. Show error toasts

**Estimated Hours**: 2 hours

---

### 5.5 Data Caching Strategy
**Story Points**: 2
**Priority**: P2
**As a** developer
**I want** smart caching
**So that** app is fast

**Acceptance Criteria**:
- [ ] Tasks cached for 5 minutes
- [ ] Household data cached for 30 minutes
- [ ] Messages cached for 1 minute
- [ ] Stale-while-revalidate pattern

**Technical Tasks**:
1. Configure React Query staleTime
2. Configure cacheTime
3. Set up background refetch
4. Implement optimistic updates

**Estimated Hours**: 1-2 hours

---

# 👥 EPIC 6: Chat & Communication
**Priority**: P2 (Medium)
**Total Story Points**: 21 SP
**Sprint**: Sprint 3

## User Stories

### 6.1 Chat Screen - Message List
**Story Points**: 5
**Priority**: P2
**As a** household member
**I want** to see family chat messages
**So that** I can communicate

**Acceptance Criteria**:
- [ ] Fetch messages from Supabase
- [ ] Display in chronological order
- [ ] Show sender avatar and name
- [ ] Different bubble color for my messages vs others
- [ ] Scroll to bottom on load
- [ ] Auto-scroll on new message

**Technical Tasks**:
1. Replace stub in `app/(tabs)/chat.tsx`
2. Fetch from `messages` table
3. FlatList with inverted (bottom-up)
4. Message bubble component
5. Group by date headers

**Estimated Hours**: 3 hours

---

### 6.2 Send Messages
**Story Points**: 3
**Priority**: P2
**As a** household member
**I want** to send messages
**So that** I can chat

**Acceptance Criteria**:
- [ ] Text input at bottom
- [ ] Send button
- [ ] Insert into Supabase `messages` table
- [ ] Message appears immediately (optimistic update)
- [ ] Clear input after send

**Technical Tasks**:
1. Add TextInput and Send button
2. useMutation for sendMessage
3. Insert into `messages` table
4. Optimistic update in React Query
5. Clear input

**Estimated Hours**: 2 hours

---

### 6.3 Image Messages
**Story Points**: 5
**Priority**: P3
**As a** user
**I want** to send images
**So that** I can share photos

**Acceptance Criteria**:
- [ ] Image picker button
- [ ] Upload to Supabase Storage
- [ ] Show image preview in chat
- [ ] Tap to view full-screen

**Technical Tasks**:
1. Use expo-image-picker
2. Upload to Supabase Storage bucket
3. Store image_url in messages
4. Render images in chat bubbles
5. Full-screen image viewer

**Estimated Hours**: 4 hours

---

### 6.4 Real-time Chat Updates
**Story Points**: 5
**Priority**: P2
**As a** user
**I want** instant message delivery
**So that** chat feels live

**Acceptance Criteria**:
- [ ] Subscribe to new messages in Supabase
- [ ] New messages appear without refresh
- [ ] Typing indicator (optional)
- [ ] Unread count badge on tab (optional)

**Technical Tasks**:
1. Supabase Realtime subscription on `messages`
2. Append new messages to list
3. Update badge count on Chat tab
4. Play sound on new message (optional)

**Estimated Hours**: 3 hours

---

### 6.5 System Messages
**Story Points**: 3
**Priority**: P3
**As a** system
**I want** to send automated messages
**So that** users know about events

**Acceptance Criteria**:
- [ ] "X completed task Y" messages
- [ ] "X joined household" messages
- [ ] Different styling for system messages
- [ ] Not sent by any specific member

**Technical Tasks**:
1. Check message type: 'system'
2. Render differently (centered, gray)
3. Trigger from task completion, member join, etc.

**Estimated Hours**: 2 hours

---

# 🏆 EPIC 7: Gamification - Captain & Ratings
**Priority**: P2 (Medium)
**Total Story Points**: 24 SP
**Sprint**: Sprint 3-4

## User Stories

### 7.1 Captain Rotation System
**Story Points**: 8
**Priority**: P2
**As a** system
**I want** to rotate Cleaning Captain weekly
**So that** responsibility is shared

**Acceptance Criteria**:
- [ ] Automatically assign new captain every Monday
- [ ] Round-robin rotation through all members
- [ ] Skip pets from rotation
- [ ] Show current captain on Home screen
- [ ] Show days left in captain week

**Technical Tasks**:
1. Cron job or Supabase Edge Function (weekly)
2. Insert into `cleaning_captains` table
3. Calculate next captain (round-robin)
4. Update Home screen to show current captain
5. Display countdown

**Estimated Hours**: 5-6 hours

---

### 7.2 Rate Captain Screen
**Story Points**: 5
**Priority**: P2
**As a** household member
**I want** to rate the captain
**So that** we give feedback

**Acceptance Criteria**:
- [ ] "Rate Captain" button on Home screen
- [ ] Only available after captain week ends
- [ ] Star rating (1-5 stars)
- [ ] Positive feedback tags (checkboxes)
- [ ] Improvement suggestions (checkboxes)
- [ ] Optional text feedback
- [ ] Private notes (only captain sees)

**Technical Tasks**:
1. Create `/app/(modals)/rate-captain.tsx`
2. Star rating component
3. Tag selection (from RATING_OPTIONS in constants)
4. Insert into `captain_ratings` table
5. Calculate average rating
6. Update captain's stats

**Estimated Hours**: 3-4 hours

---

### 7.3 Captain Performance Stats
**Story Points**: 5
**Priority**: P3
**As a** captain
**I want** to see my performance
**So that** I know how I'm doing

**Acceptance Criteria**:
- [ ] Show average rating
- [ ] Show positive feedback tags
- [ ] Show improvement areas
- [ ] Show comparison to previous weeks
- [ ] Unlock "5-Star Captain" badge

**Technical Tasks**:
1. Add stats section to Profile screen
2. Fetch ratings for member
3. Calculate average, most common tags
4. Display charts (optional)
5. Check for badge unlock

**Estimated Hours**: 3 hours

---

### 7.4 Captain Bonus Points
**Story Points**: 3
**Priority**: P3
**As a** captain with high rating
**I want** bonus points
**So that** I'm rewarded for good work

**Acceptance Criteria**:
- [ ] 5-star rating = +20% bonus points that week
- [ ] 4-star rating = +10% bonus
- [ ] 3-star or below = no bonus
- [ ] Bonus applied to all tasks completed as captain

**Technical Tasks**:
1. Calculate bonus multiplier from rating
2. Apply to points when completing tasks
3. Show bonus in points earned notification

**Estimated Hours**: 2 hours

---

### 7.5 Captain History & Leaderboard
**Story Points**: 3
**Priority**: P3
**As a** user
**I want** to see captain history
**So that** I know who was best

**Acceptance Criteria**:
- [ ] List of all past captains
- [ ] Average rating for each
- [ ] "Best Captain" badge for highest average
- [ ] Filter by year/month

**Technical Tasks**:
1. Fetch from `cleaning_captains` table
2. Display list with ratings
3. Calculate best captain
4. Award badge

**Estimated Hours**: 2 hours

---

# 🏅 EPIC 8: Achievements & Badges
**Priority**: P2 (Medium)
**Total Story Points**: 18 SP
**Sprint**: Sprint 4

## User Stories

### 8.1 Badge Award System
**Story Points**: 8
**Priority**: P2
**As a** system
**I want** to award badges automatically
**So that** users are rewarded

**Acceptance Criteria**:
- [ ] Check badge criteria on key events (task complete, streak update, etc.)
- [ ] Award badge if criteria met
- [ ] Show celebration animation
- [ ] Notification of badge earned
- [ ] Prevent duplicate awards

**Technical Tasks**:
1. Create badge checking logic in `/src/utils/badges.ts`
2. Define criteria for each badge (from BADGES constant)
3. Check on task completion, streak update, etc.
4. Insert into `member_badges` table
5. Show modal with badge animation
6. Use lottie-react-native for confetti

**Estimated Hours**: 5-6 hours

---

### 8.2 Badge Display in Profile
**Story Points**: 3
**Priority**: P2
**As a** user
**I want** to see my badges
**So that** I can show my achievements

**Acceptance Criteria**:
- [ ] Grid of earned badges in Profile
- [ ] Locked badges shown as silhouettes
- [ ] Tap badge to see details + criteria
- [ ] Badge count (X/20 for premium, X/5 for free)

**Technical Tasks**:
1. Add badges section to Profile screen
2. Fetch from `member_badges` table
3. Grid layout with icons
4. Modal for badge details
5. Show locked badges as grayscale

**Estimated Hours**: 2 hours

---

### 8.3 Badge Criteria Definitions
**Story Points**: 5
**Priority**: P2
**As a** developer
**I want** flexible badge criteria
**So that** new badges can be added easily

**Acceptance Criteria**:
- [ ] Criteria stored in database
- [ ] Support: task count, streak days, rating, etc.
- [ ] JSON field for complex criteria
- [ ] Seed free + premium badges

**Technical Tasks**:
1. Migrate badge data to Supabase
2. Create badge criteria evaluator
3. Support various criteria types
4. Seed badges from constants

**Estimated Hours**: 3 hours

---

### 8.4 Premium Badge Unlocks
**Story Points**: 2
**Priority**: P3
**As a** premium user
**I want** access to premium badges
**So that** I have more to unlock

**Acceptance Criteria**:
- [ ] Free users: 5 badges max
- [ ] Premium users: 20+ badges
- [ ] Show upgrade prompt when tapping locked premium badge

**Technical Tasks**:
1. Check premium status
2. Filter badges by tier
3. Show premium gate for locked badges

**Estimated Hours**: 1 hour

---

# 📈 EPIC 9: Points, Levels & Leaderboard
**Priority**: P1 (High)
**Total Story Points**: 19 SP
**Sprint**: Sprint 2-3

## User Stories

### 9.1 Points Calculation System
**Story Points**: 5
**Priority**: P1
**As a** system
**I want** to calculate points automatically
**So that** users are rewarded fairly

**Acceptance Criteria**:
- [ ] Base points from estimated time (5 min = 1 point)
- [ ] Speed bonus if completed faster (+30% if <80% of estimate)
- [ ] Streak bonus (+5 points if 7+ day streak)
- [ ] Captain bonus (if current captain, multiplier from rating)
- [ ] Update member points in database

**Technical Tasks**:
1. Create `/src/utils/points.ts`
2. Function: `calculatePoints(task, actualMinutes, streakDays, isCaptain, captainRating)`
3. Apply bonuses
4. Update `members.points` in Supabase
5. Trigger on task completion

**Estimated Hours**: 3 hours

---

### 9.2 Level-Up System
**Story Points**: 3
**Priority**: P1
**As a** user
**I want** to level up
**So that** I see my progress

**Acceptance Criteria**:
- [ ] 100 points = 1 level
- [ ] Level shown in Profile and member cards
- [ ] Level-up animation when threshold reached
- [ ] Free users max level 20
- [ ] Premium users max level 50

**Technical Tasks**:
1. Calculate level: `Math.floor(points / 100)`
2. Update `members.level` on point change
3. Detect level-up (old level < new level)
4. Show celebration modal
5. Check for "Legendary" badge at level 50

**Estimated Hours**: 2 hours

---

### 9.3 Leaderboard Screen
**Story Points**: 5
**Priority**: P1
**As a** user
**I want** to see household rankings
**So that** I know my standing

**Acceptance Criteria**:
- [ ] List all household members by points DESC
- [ ] Show rank, name, avatar, points, level
- [ ] Highlight current user
- [ ] Toggle: This Week / This Month / All Time
- [ ] Show #1 with crown icon

**Technical Tasks**:
1. Replace stub in `app/(tabs)/leaderboard.tsx`
2. Fetch members ordered by points
3. Calculate ranks
4. Podium design for top 3
5. Add time filter (week/month/all-time)

**Estimated Hours**: 3 hours

---

### 9.4 Streak Tracking
**Story Points**: 3
**Priority**: P2
**As a** user
**I want** to maintain a streak
**So that** I'm motivated daily

**Acceptance Criteria**:
- [ ] Increment streak when task completed each day
- [ ] Reset streak if no task completed in 24 hours
- [ ] Show streak count on Home screen
- [ ] Fire emoji if 7+ day streak
- [ ] "Week Warrior" badge at 7 days

**Technical Tasks**:
1. Track `members.streak_days`
2. Update on task completion
3. Cron job to reset streaks (daily check)
4. Display streak on Home

**Estimated Hours**: 2 hours

---

### 9.5 Leaderboard Notifications (Optional)
**Story Points**: 3
**Priority**: P3
**As a** user
**I want** notifications when rank changes
**So that** I stay engaged

**Acceptance Criteria**:
- [ ] Notify when surpassed by someone
- [ ] Notify when reaching #1
- [ ] Weekly recap notification

**Technical Tasks**:
1. Detect rank changes
2. Send push notification
3. Use expo-notifications

**Estimated Hours**: 2 hours

---

# 👤 EPIC 10: Profile & Settings
**Priority**: P1 (High)
**Total Story Points**: 16 SP
**Sprint**: Sprint 2-3

## User Stories

### 10.1 Profile Screen Layout
**Story Points**: 5
**Priority**: P1
**As a** user
**I want** a profile screen
**So that** I can manage my account

**Acceptance Criteria**:
- [ ] Show user avatar, name, level, points
- [ ] My badges section
- [ ] My stats (tasks completed, streak, rank)
- [ ] Captain history
- [ ] Settings button
- [ ] Logout button

**Technical Tasks**:
1. Replace stub in `app/(tabs)/profile.tsx`
2. Fetch current member data
3. Display stats
4. Link to badges, settings
5. Logout button (call auth.signOut)

**Estimated Hours**: 3 hours

---

### 10.2 Edit Profile
**Story Points**: 3
**Priority**: P1
**As a** user
**I want** to edit my profile
**So that** I can update my info

**Acceptance Criteria**:
- [ ] Change name
- [ ] Change avatar (emoji picker)
- [ ] Cannot change type (human/pet) after creation
- [ ] Save to Supabase

**Technical Tasks**:
1. Create edit profile modal
2. Form with name, avatar
3. Update `members` table
4. Invalidate cache

**Estimated Hours**: 2 hours

---

### 10.3 App Settings
**Story Points**: 5
**Priority**: P2
**As a** user
**I want** app settings
**So that** I can customize

**Acceptance Criteria**:
- [ ] Notifications on/off
- [ ] Household settings
- [ ] Theme (light/dark) - future
- [ ] Language - future
- [ ] Privacy policy link
- [ ] Terms of service link

**Technical Tasks**:
1. Create settings screen
2. Toggle switches
3. Store preferences in AsyncStorage
4. Link to web pages

**Estimated Hours**: 3 hours

---

### 10.4 Premium Badge in Profile
**Story Points**: 2
**Priority**: P2
**As a** premium user
**I want** premium badge shown
**So that** others see my status

**Acceptance Criteria**:
- [ ] "Premium" badge next to name
- [ ] Different color avatar border
- [ ] "Manage Subscription" button

**Technical Tasks**:
1. Check `isPremium` from store
2. Render premium badge
3. Link to subscription modal

**Estimated Hours**: 1 hour

---

### 10.5 Account Deletion
**Story Points**: 1
**Priority**: P3
**As a** user
**I want** to delete my account
**So that** I can remove my data

**Acceptance Criteria**:
- [ ] "Delete Account" in settings
- [ ] Confirmation dialog (type email to confirm)
- [ ] Delete user from Supabase auth
- [ ] Remove member from household
- [ ] Logout and redirect to welcome

**Technical Tasks**:
1. Confirmation flow
2. Delete auth user
3. Cascade delete member data
4. Clear app data

**Estimated Hours**: 1 hour

---

# 🎨 EPIC 11: Rooms & Notes Feature
**Priority**: P2 (Medium)
**Total Story Points**: 20 SP
**Sprint**: Sprint 4

## User Stories

### 11.1 Rooms List Screen
**Story Points**: 5
**Priority**: P2
**As a** user
**I want** to see household rooms
**So that** I can manage them

**Acceptance Criteria**:
- [ ] Replace stub in `app/(tabs)/rooms.tsx`
- [ ] List all rooms with icon and name
- [ ] Tap room to see notes
- [ ] "Add Room" button
- [ ] Edit/delete room

**Technical Tasks**:
1. Fetch from `rooms` table
2. Display in list/grid
3. Navigate to room details
4. CRUD operations

**Estimated Hours**: 3 hours

---

### 11.2 Room Details & Notes
**Story Points**: 8
**Priority**: P2
**As a** user
**I want** to add sticky notes to rooms
**So that** I can leave reminders

**Acceptance Criteria**:
- [ ] Room details screen
- [ ] List of notes (sticky note UI)
- [ ] Add note button
- [ ] Note has: text, color, image (optional), pin option, expiry
- [ ] Free users: 3 notes per room
- [ ] Premium users: unlimited notes
- [ ] Expired notes auto-deleted

**Technical Tasks**:
1. Create room details screen
2. Fetch `room_notes` for room
3. Create note component (sticky note style)
4. Add/edit/delete notes
5. Image upload to Supabase Storage
6. Check note limits (free/premium)
7. Cron to delete expired notes

**Estimated Hours**: 6 hours

---

### 11.3 Add/Edit Room
**Story Points**: 3
**Priority**: P2
**As a** household admin
**I want** to add rooms
**So that** they match my home

**Acceptance Criteria**:
- [ ] Form: name, icon (emoji or preset)
- [ ] Insert into `rooms` table
- [ ] Presets: Living Room, Kitchen, Bedroom, Bathroom, etc. (from ROOM_PRESETS constant)

**Technical Tasks**:
1. Create add room modal
2. Form with name + icon picker
3. Insert into Supabase
4. Show in rooms list

**Estimated Hours**: 2 hours

---

### 11.4 Pinned Notes
**Story Points**: 2
**Priority**: P3
**As a** user
**I want** to pin important notes
**So that** they stay at the top

**Acceptance Criteria**:
- [ ] Toggle pin button on note
- [ ] Pinned notes shown first
- [ ] Pin icon indicator

**Technical Tasks**:
1. Update `is_pinned` field
2. Order by: `is_pinned DESC, created_at DESC`
3. Pin icon on note

**Estimated Hours**: 1 hour

---

### 11.5 Note Expiry & Auto-Delete
**Story Points**: 2
**Priority**: P3
**As a** system
**I want** to delete expired notes
**So that** rooms stay clean

**Acceptance Criteria**:
- [ ] User sets expiry when creating note
- [ ] Expired notes deleted automatically (daily cron)
- [ ] Warning 1 day before expiry (optional)

**Technical Tasks**:
1. Set `expires_at` field
2. Cron job (Supabase Edge Function)
3. Delete where `expires_at < NOW()`

**Estimated Hours**: 1-2 hours

---

# 🔐 EPIC 12: Security & Permissions
**Priority**: P1 (High)
**Total Story Points**: 18 SP
**Sprint**: Sprint 2

## User Stories

### 12.1 Row Level Security (RLS) Policies
**Story Points**: 5
**Priority**: P1
**As a** developer
**I want** RLS policies on all tables
**So that** users can only access their data

**Acceptance Criteria**:
- [ ] Users can only see households they belong to
- [ ] Users can only see members in their household
- [ ] Users can only see tasks in their household
- [ ] Admins can edit/delete, members can view
- [ ] Policies tested and verified

**Technical Tasks**:
1. Write RLS policies for each table (already in SETUP-SUPABASE.sql)
2. Test with different users
3. Verify no data leakage

**Estimated Hours**: 3 hours

---

### 12.2 Admin Role Permissions
**Story Points**: 3
**Priority**: P1
**As a** household admin
**I want** special permissions
**So that** I can manage the household

**Acceptance Criteria**:
- [ ] Only admins can: add/remove members, delete household, change settings
- [ ] Members can: create tasks, complete tasks, send messages
- [ ] Check role before sensitive actions

**Technical Tasks**:
1. Add role checks in UI
2. Disable buttons for non-admins
3. Verify role in backend (RLS)

**Estimated Hours**: 2 hours

---

### 12.3 Input Validation & Sanitization
**Story Points**: 3
**Priority**: P1
**As a** developer
**I want** input validation
**So that** app is secure

**Acceptance Criteria**:
- [ ] Validate all form inputs
- [ ] Sanitize text to prevent XSS
- [ ] Email format validation
- [ ] Max length checks (titles, descriptions)
- [ ] SQL injection prevented (Supabase handles this)

**Technical Tasks**:
1. Create `/src/utils/validation.ts`
2. Validation functions for each input type
3. Apply to all forms
4. Show error messages

**Estimated Hours**: 2 hours

---

### 12.4 Rate Limiting (API)
**Story Points**: 5
**Priority**: P2
**As a** system
**I want** rate limiting
**So that** app isn't abused

**Acceptance Criteria**:
- [ ] Limit: 100 requests per minute per user
- [ ] Return 429 if exceeded
- [ ] Show error to user

**Technical Tasks**:
1. Implement rate limiting in Supabase Edge Functions
2. Or use middleware
3. Track by user ID or IP
4. Handle 429 errors in app

**Estimated Hours**: 3 hours

---

### 12.5 Secure File Uploads
**Story Points**: 2
**Priority**: P2
**As a** system
**I want** secure file uploads
**So that** malicious files aren't uploaded

**Acceptance Criteria**:
- [ ] Only images allowed (jpg, png, gif)
- [ ] Max file size: 5MB
- [ ] Scan for viruses (optional)
- [ ] Unique filename with UUID

**Technical Tasks**:
1. Check file type before upload
2. Check file size
3. Upload to Supabase Storage with unique name
4. Set storage policies

**Estimated Hours**: 1-2 hours

---

# 📊 EPIC 13: Analytics & Monitoring
**Priority**: P2 (Medium)
**Total Story Points**: 16 SP
**Sprint**: Sprint 4

## User Stories

### 13.1 PostHog Analytics Integration
**Story Points**: 5
**Priority**: P2
**As a** product owner
**I want** to track user behavior
**So that** I can improve the app

**Acceptance Criteria**:
- [ ] PostHog initialized on app start
- [ ] Track key events: signup, login, task_created, task_completed, premium_purchase
- [ ] User properties: household_size, premium_status
- [ ] Session tracking

**Technical Tasks**:
1. Initialize PostHog in `app/_layout.tsx`
2. Create `/src/utils/analytics.ts`
3. Track events at key points
4. Set user properties

**Estimated Hours**: 3 hours

---

### 13.2 Sentry Error Tracking
**Story Points**: 5
**Priority**: P1
**As a** developer
**I want** error tracking
**So that** I can fix bugs

**Acceptance Criteria**:
- [ ] Sentry initialized on app start
- [ ] All errors logged to Sentry
- [ ] User context attached to errors
- [ ] Breadcrumbs for debugging
- [ ] Source maps uploaded for stack traces

**Technical Tasks**:
1. Initialize Sentry in `app/_layout.tsx`
2. Set user context
3. Add error boundaries
4. Configure source maps in EAS Build
5. Test error reporting

**Estimated Hours**: 3 hours

---

### 13.3 Performance Monitoring
**Story Points**: 3
**Priority**: P2
**As a** developer
**I want** performance metrics
**So that** app is fast

**Acceptance Criteria**:
- [ ] Track screen load times
- [ ] Track API response times
- [ ] Track app startup time
- [ ] Sentry Performance monitoring

**Technical Tasks**:
1. Add Sentry Performance
2. Track navigation timing
3. Track API timing with React Query
4. Monitor in Sentry dashboard

**Estimated Hours**: 2 hours

---

### 13.4 Custom Events & Funnels
**Story Points**: 3
**Priority**: P3
**As a** product owner
**I want** conversion funnels
**So that** I know where users drop off

**Acceptance Criteria**:
- [ ] Onboarding funnel: signup -> create household -> add member -> create task
- [ ] Premium funnel: view premium -> tap upgrade -> purchase
- [ ] Task completion funnel: create task -> assign -> complete

**Technical Tasks**:
1. Define funnels in PostHog
2. Track each step
3. Analyze drop-off rates

**Estimated Hours**: 2 hours

---

# 🔔 EPIC 14: Notifications
**Priority**: P2 (Medium)
**Total Story Points**: 19 SP
**Sprint**: Sprint 4

## User Stories

### 14.1 Push Notification Setup
**Story Points**: 5
**Priority**: P2
**As a** developer
**I want** push notifications configured
**So that** users can receive alerts

**Acceptance Criteria**:
- [ ] Request notification permissions on first launch
- [ ] Register device token with Supabase
- [ ] Send test notification

**Technical Tasks**:
1. Use expo-notifications
2. Request permissions
3. Get push token
4. Store token in Supabase (users table)
5. Test sending notification

**Estimated Hours**: 3 hours

---

### 14.2 Task Assignment Notifications
**Story Points**: 3
**Priority**: P2
**As a** user
**I want** notification when task assigned
**So that** I know my responsibilities

**Acceptance Criteria**:
- [ ] Notification when task assigned to me
- [ ] Tap notification opens task details
- [ ] Shows task title and due date

**Technical Tasks**:
1. Trigger on task assignment
2. Send push notification to assignee
3. Deep link to task details

**Estimated Hours**: 2 hours

---

### 14.3 Task Due Reminders
**Story Points**: 5
**Priority**: P2
**As a** user
**I want** reminders for due tasks
**So that** I don't forget

**Acceptance Criteria**:
- [ ] Reminder 1 hour before due time
- [ ] Reminder at due time if not completed
- [ ] Daily summary at 9 AM

**Technical Tasks**:
1. Cron job to check due tasks
2. Send notifications
3. Local notifications with expo-notifications

**Estimated Hours**: 3 hours

---

### 14.4 Chat Message Notifications
**Story Points**: 3
**Priority**: P2
**As a** user
**I want** notification on new messages
**So that** I don't miss conversations

**Acceptance Criteria**:
- [ ] Notification on new message
- [ ] Only if app is in background
- [ ] Shows sender name and message preview
- [ ] Tap opens chat

**Technical Tasks**:
1. Trigger on new message
2. Check app state (background/foreground)
3. Send push notification
4. Deep link to chat

**Estimated Hours**: 2 hours

---

### 14.5 Notification Preferences
**Story Points**: 3
**Priority**: P3
**As a** user
**I want** to control notifications
**So that** I'm not spammed

**Acceptance Criteria**:
- [ ] Settings: tasks, messages, achievements, reminders on/off
- [ ] Mute notifications for X hours
- [ ] Quiet hours (e.g., 10 PM - 8 AM)

**Technical Tasks**:
1. Add settings toggles
2. Store preferences
3. Check preferences before sending
4. Schedule quiet hours

**Estimated Hours**: 2 hours

---

# 🧪 EPIC 15: Testing & Quality Assurance
**Priority**: P2 (Medium)
**Total Story Points**: 24 SP
**Sprint**: Sprint 5

## User Stories

### 15.1 Unit Tests - Utilities & Helpers
**Story Points**: 5
**Priority**: P2
**As a** developer
**I want** unit tests for utilities
**So that** core logic is reliable

**Acceptance Criteria**:
- [ ] Test points calculation
- [ ] Test level calculation
- [ ] Test badge criteria checking
- [ ] Test validation functions
- [ ] 80%+ code coverage on utils

**Technical Tasks**:
1. Set up Jest (already configured)
2. Write tests in `/src/utils/__tests__/`
3. Test all functions in points.ts, validation.ts, badges.ts
4. Run `npm test`

**Estimated Hours**: 3 hours

---

### 15.2 Integration Tests - Auth Flow
**Story Points**: 5
**Priority**: P2
**As a** developer
**I want** integration tests for auth
**So that** login/signup works

**Acceptance Criteria**:
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test logout
- [ ] Test password reset
- [ ] Mock Supabase responses

**Technical Tasks**:
1. Use @testing-library/react-native
2. Mock Supabase client
3. Test auth screens
4. Test AuthContext

**Estimated Hours**: 3 hours

---

### 15.3 Integration Tests - Task CRUD
**Story Points**: 5
**Priority**: P2
**As a** developer
**I want** integration tests for tasks
**So that** core features work

**Acceptance Criteria**:
- [ ] Test create task
- [ ] Test list tasks
- [ ] Test complete task
- [ ] Test delete task
- [ ] Mock Supabase

**Technical Tasks**:
1. Test task creation flow
2. Test task list rendering
3. Test completion flow
4. Mock API responses

**Estimated Hours**: 3 hours

---

### 15.4 E2E Tests - Critical Flows
**Story Points**: 8
**Priority**: P3
**As a** QA
**I want** end-to-end tests
**So that** app works as a whole

**Acceptance Criteria**:
- [ ] Test: Signup -> Create household -> Create task -> Complete task
- [ ] Test: Login -> View leaderboard -> Rate captain
- [ ] Test: Purchase premium -> Access premium features

**Technical Tasks**:
1. Set up Detox or Maestro
2. Write E2E test scripts
3. Run on simulator
4. Run in CI (optional)

**Estimated Hours**: 6 hours

---

### 15.5 Manual QA Checklist
**Story Points**: 1
**Priority**: P1
**As a** QA
**I want** a QA checklist
**So that** I can test systematically

**Acceptance Criteria**:
- [ ] Checklist covers all features
- [ ] Test on iOS
- [ ] Test on Android (future)
- [ ] Test edge cases (no internet, etc.)

**Technical Tasks**:
1. Create QA checklist document
2. Cover all user flows
3. Test on real device

**Estimated Hours**: 1 hour

---

# 📊 Backlog Summary

## By Priority:

### P0 (Critical - MVP Blockers): 98 SP
- EPIC 1: Authentication (21 SP)
- EPIC 2: Task Management (31 SP)
- EPIC 3: Household Management (26 SP)
- EPIC 5: Data Layer (20 SP)

### P1 (High - Core Features): 89 SP
- EPIC 4: Component Library (21 SP)
- EPIC 9: Points & Leaderboard (19 SP)
- EPIC 10: Profile (16 SP)
- EPIC 12: Security (18 SP)
- EPIC 13: Analytics (partial) (5 SP)
- EPIC 15: Testing (partial) (10 SP)

### P2 (Medium - Important): 114 SP
- EPIC 6: Chat (21 SP)
- EPIC 7: Captain System (24 SP)
- EPIC 8: Badges (18 SP)
- EPIC 11: Rooms & Notes (20 SP)
- EPIC 13: Analytics (remaining) (11 SP)
- EPIC 14: Notifications (19 SP)
- EPIC 15: Testing (remaining) (14 SP)

### P3 (Low - Nice-to-have): 86 SP
- Various optional features across EPICs

---

## Sprint Planning Recommendations

### Sprint 1 (2 weeks - 20-25 SP): MVP Foundation
**Goal**: Authentication + Basic Task Management
- EPIC 1: Stories 1.1-1.5 (Auth) - 16 SP
- EPIC 2: Stories 2.1-2.2 (Create + List Tasks) - 13 SP
**Total: ~29 SP** (slightly over, adjust if needed)

### Sprint 2 (2 weeks - 20-25 SP): Core Features
**Goal**: Complete Task CRUD + Households
- EPIC 2: Stories 2.3-2.7 (Task Details, Edit, Complete) - 18 SP
- EPIC 3: Stories 3.1-3.2 (Household Setup) - 10 SP
**Total: 28 SP**

### Sprint 3 (2 weeks - 20-25 SP): UI & Gamification
**Goal**: Component Library + Points System
- EPIC 4: Component Library - 21 SP
- EPIC 9: Stories 9.1-9.3 (Points, Levels, Leaderboard) - 13 SP
**Total: 34 SP** (can move some to Sprint 4)

### Sprint 4 (2 weeks - 20-25 SP): Extended Features
**Goal**: Profile, Chat, Security
- EPIC 10: Profile (16 SP)
- EPIC 6: Chat (partial) - 8 SP
- EPIC 12: Security (partial) - 8 SP
**Total: 32 SP**

### Sprint 5 (2 weeks - 20-25 SP): Polish & Launch Prep
**Goal**: Remaining features, Testing, Analytics
- EPIC 13: Analytics (16 SP)
- EPIC 15: Testing (10 SP)
- Polish & Bug Fixes
**Total: 26 SP**

**Total MVP Delivery: 10 weeks (5 sprints)**

---

## Definition of Done (DoD)

For a story to be considered DONE:
- [ ] Code written and reviewed
- [ ] TypeScript types added
- [ ] Error handling implemented
- [ ] UI matches design system
- [ ] Tested on iOS simulator
- [ ] No console errors or warnings
- [ ] Data persists correctly
- [ ] Loading states handled
- [ ] Accessible (screen reader friendly)
- [ ] Committed to Git with clear message
- [ ] Product Owner approved

---

## Risks & Dependencies

### High Risk:
1. **Supabase Real-time reliability** - May need fallback polling
2. **RevenueCat setup complexity** - Need App Store Connect coordination
3. **Push notifications** - Apple certificate setup required

### External Dependencies:
1. **Supabase account** - Already set up ✅
2. **RevenueCat account** - Already set up ✅
3. **Apple Developer account** - Already have ✅
4. **App Store review** - 1-2 weeks
5. **Email service** - For invites (Supabase or SendGrid)

---

## Maintenance & Future Enhancements (Backlog++)

**Not in current scope, but future ideas:**
- Android support
- Web version (PWA)
- Themes (light/dark mode)
- Multi-language support
- Social sharing
- Calendar integration
- Recurring tasks
- Subtasks
- Task templates
- Family challenges
- Rewards & incentives
- Pet care tracking
- Grocery lists
- Meal planning

---

**Document Owner**: Product Manager
**Last Updated**: 23 October 2025
**Next Review**: After Sprint 1

---

*This backlog is a living document and will be updated as priorities change.*