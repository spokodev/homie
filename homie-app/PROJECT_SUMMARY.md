# HomieLife - Project Summary

## Overview

HomieLife is a gamified household task management application built with React Native, Expo, and Supabase. The app helps families organize tasks, track progress, and make household chores fun through points, levels, badges, and weekly captain rotations.

**Progress:** 278 SP / 387 SP (71.8% Complete)
**Technology Stack:** React Native 0.74.5, Expo SDK 51, TypeScript, Supabase, React Query

---

## Core Features Implemented

### 1. Authentication & Onboarding ✅
- Email/password authentication with Supabase
- Complete onboarding flow
  - Household creation with icon selection
  - First member setup
  - Welcome tour
- Session management and token refresh
- Analytics tracking for auth events

### 2. Task Management ✅
- **CRUD Operations:**
  - Create tasks with title, description, room, estimated time
  - Update task details
  - Delete tasks (with permissions)
  - Complete tasks with points reward
- **Quick Task Templates:**
  - 8 pre-defined common tasks
  - One-tap creation with auto-filled details
  - Icons and estimated times
- **Task Assignment:**
  - Assign to specific household members
  - Assign to pets
  - "Anyone" option for unassigned tasks
  - Reassignment capability
- **Points System:**
  - Automatic calculation based on estimated time (5 min = 1 point)
  - Bonus points for speed completion
  - Points tracked per member

### 3. Gamification System ✅
- **Levels & XP:**
  - 100 points per level
  - Level titles (Newbie, Helper, Pro, etc.)
  - Color-coded level badges
  - Max level 20 (free) / 50 (premium)
- **Streak Tracking:**
  - Daily streak counter
  - Streak bonus points
  - Visual flame indicators
- **Leaderboard:**
  - Ranked by total points
  - Real-time updates
  - Current user highlighting
  - Level progression display
- **Badges System:**
  - 5 free badges
  - 15 premium badges
  - Progress tracking
  - Achievement unlocks

### 4. Captain & Ratings System ✅ (EPIC 7 - 24 SP)
- **Weekly Captain Rotation:**
  - Auto-selects member who's been captain least often
  - 7-day rotation cycle
  - Tracks times_captain and average ratings
  - Admin manual rotation capability
- **Rating System:**
  - 1-5 star ratings with labels
  - Optional text feedback
  - Prevents duplicate ratings per rotation
  - Awards bonus points for 4-5 stars (rating × 20)
- **Database Schema:**
  - captain_ratings table with rotation tracking
  - Captain fields in households table
  - Captain stats in members table
- **UI Components:**
  - Captain card on home screen
  - Rate-captain modal
  - Captain stats in profile
  - 35 integration tests

### 5. Chat & Communication ✅ (EPIC 6 - 21 SP)
- **Real-time Messaging:**
  - Supabase Realtime WebSocket integration
  - Message bubbles (own vs others)
  - Member avatars and names
  - Timestamp display
- **Features:**
  - Send text messages
  - Delete messages (admins)
  - Auto-scroll to latest
  - Optimistic updates
  - System messages support

### 6. Rooms & Notes ✅ (EPIC 11 - 20 SP)
- **Room Management:**
  - Create custom rooms
  - 8 room presets
  - Icon selection (24 options)
  - CRUD operations
- **Sticky Notes:**
  - Create notes per room
  - 6 color options
  - Pin/unpin functionality
  - Free tier: 3 notes per room
  - Premium: unlimited notes
  - Member attribution

### 7. Family Member Management ✅ (+8 SP)
- **Add Members Modal:**
  - Add family members or pets
  - Person/Pet toggle
  - 24 human avatars + 24 pet avatars
  - Name validation
  - Live preview
- **Household Members Screen:**
  - View all members and pets
  - Separate sections
  - Member stats (points, streaks)
  - Delete members (admin only)
  - Level titles for humans
- **Navigation:**
  - Accessible from profile menu
  - Admin permission checks

### 8. Analytics & Monitoring ✅
- **PostHog Analytics (EPIC 13.1 - 5 SP):**
  - 30+ predefined events
  - User identification
  - Event properties
  - Screen view tracking
- **Performance Monitoring (EPIC 13.3 - 3 SP):**
  - Sentry transactions
  - Screen load timing
  - API request tracking
  - Async function measurement
- **Custom Funnels (EPIC 13.4 - 3 SP):**
  - Onboarding funnel (4 steps)
  - Premium conversion funnel (3 steps)
  - Task completion funnel (2 steps)

---

## Technical Architecture

### Frontend
- **Framework:** React Native 0.74.5 with Expo SDK 51
- **Language:** TypeScript with strict mode
- **Navigation:** Expo Router v3 (file-based routing)
- **State Management:**
  - React Query (TanStack Query) for server state
  - Context API for global state (Auth, Household)
  - Zustand for client state (Premium)
- **UI/UX:**
  - Custom theme system (colors, typography, spacing)
  - React Native Reanimated 3 for animations
  - SafeAreaView for cross-device compatibility

### Backend
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Realtime (WebSocket channels)
- **Authentication:** Supabase Auth
- **Row Level Security:** Enabled on all tables
- **Database Schema:**
  - households, members, tasks, messages
  - rooms, room_notes, captain_ratings
  - member_badges
  - Complete schema in DATABASE_SCHEMA.md

### Testing
- **Framework:** Jest 29.2.1 + @testing-library/react-native
- **Integration Tests:** 166+ tests
  - useTasks (34 tests)
  - useMembers (8 tests)
  - useMessages (8 tests)
  - useRooms (9 tests)
  - useBadges (8 tests)
  - useCaptain (15 tests)
  - useRatings (20 tests)
- **Test Coverage:** Hooks, validation, gamification logic

### DevOps & Monitoring
- **Error Tracking:** Sentry
- **Analytics:** PostHog
- **Performance:** Sentry Performance Monitoring
- **Environment:** .env configuration

---

## Project Structure

```
homie-app/
├── app/
│   ├── (auth)/             # Auth screens
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/             # Main tab navigation
│   │   ├── home.tsx
│   │   ├── chat.tsx
│   │   ├── rooms.tsx
│   │   ├── leaderboard.tsx
│   │   └── profile.tsx
│   ├── (modals)/           # Modal screens
│   │   ├── create-task.tsx
│   │   ├── task-details.tsx
│   │   ├── edit-profile.tsx
│   │   ├── add-member.tsx
│   │   ├── household-members.tsx
│   │   ├── add-room.tsx
│   │   ├── room-details.tsx
│   │   ├── add-note.tsx
│   │   ├── rate-captain.tsx
│   │   └── subscription.tsx
│   └── _layout.tsx
├── src/
│   ├── components/         # Reusable components
│   │   ├── Form/
│   │   ├── Modal/
│   │   └── Toast/
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   └── HouseholdContext.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useTasks.ts
│   │   ├── useMembers.ts
│   │   ├── useMessages.ts
│   │   ├── useRooms.ts
│   │   ├── useRoomNotes.ts
│   │   ├── useBadges.ts
│   │   ├── useCaptain.ts
│   │   ├── useRatings.ts
│   │   └── __tests__/      # Integration tests
│   ├── stores/             # Zustand stores
│   │   └── premium.store.ts
│   ├── utils/              # Utility functions
│   │   ├── analytics.ts
│   │   ├── performance.ts
│   │   ├── validation.ts
│   │   ├── gamification.ts
│   │   └── permissions.ts
│   ├── constants/
│   │   └── index.ts
│   ├── theme/
│   │   └── index.ts
│   └── lib/
│       └── supabase.ts
├── API-REFERENCE.md        # Complete API documentation
├── DATABASE_SCHEMA.md      # Database schema & migrations
└── PROJECT_SUMMARY.md      # This file
```

---

## Key Design Patterns

### 1. Real-time Subscriptions
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`messages:${householdId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `household_id=eq.${householdId}`,
    }, handleNewMessage)
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [householdId]);
```

### 2. Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: createTask,
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['tasks']);
    // Snapshot previous value
    const previous = queryClient.getQueryData(['tasks']);
    // Optimistically update
    queryClient.setQueryData(['tasks'], old => [...old, newTask]);
    return { previous };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previous);
  },
});
```

### 3. Permission System
```typescript
export const MemberPermissions = {
  canEditTask: (member, creatorId) => {
    return {
      allowed: member?.role === 'admin' || member?.id === creatorId,
      reason: 'Only admins or task creators can edit',
    };
  },
};
```

---

## Database Tables

### households
- Core household information
- Captain rotation data (captain_member_id, captain_started_at, captain_ends_at)
- Captain ratings (captain_total_ratings, captain_average_rating)

### members
- Family members and pets
- Type: 'human' | 'pet'
- Role: 'admin' | 'member'
- Gamification (points, level, streak_days)
- Captain stats (times_captain, captain_average_rating)

### tasks
- Task information and status
- Assignment (assignee_id)
- Time tracking (estimated_minutes, actual_minutes)
- Points and completion

### messages
- Real-time chat messages
- Type: 'text' | 'image' | 'system'
- Member attribution

### rooms
- Custom rooms with icons
- Household scoped

### room_notes
- Sticky notes per room
- Color options (6 colors)
- Pin/unpin functionality
- Member attribution

### captain_ratings
- Captain performance ratings
- 1-5 star scale
- Rotation tracking (rotation_start, rotation_end)
- Optional text feedback
- Unique constraint per member per rotation

### member_badges
- Badge achievements
- Earned timestamp
- Unique per member per badge

---

## Analytics Events

### Authentication
- user_signup, user_login, user_logout
- onboarding_started, household_created, member_added, onboarding_completed

### Tasks
- task_created, task_completed, task_deleted, task_updated, task_assigned

### Captain System
- captain_rotated (manual_selection property)
- captain_rated (rating, has_comment properties)

### Premium
- premium_upgrade_viewed, premium_upgrade_clicked, premium_purchase

### Navigation
- screen_viewed, tab_changed

---

## Free vs Premium Features

### Free Tier
- 1 household
- Up to 5 members
- Basic badges (5)
- 3 notes per room
- Max level 20
- Core task management
- Chat & communication
- Room management

### Premium Tier ($4.99/month or $49.99/year)
- Unlimited members
- All badges (20)
- Unlimited notes per room
- Max level 50
- Advanced analytics
- Priority support
- All future features

---

## Performance Optimizations

1. **React Query Caching:**
   - 5-minute stale time for member data
   - 30-minute stale time for household data
   - Aggressive cache invalidation on mutations

2. **Real-time Subscription Management:**
   - Single channel per household
   - Automatic cleanup on unmount
   - Debounced updates

3. **Image & Asset Optimization:**
   - Emoji-based icons (no image assets)
   - SVG icons via Ionicons
   - Lazy loading for modals

4. **Code Splitting:**
   - Route-based code splitting via Expo Router
   - Dynamic imports for heavy components

---

## Security Measures

1. **Row Level Security (RLS):**
   - All tables protected
   - User can only access their household's data

2. **Permission Checks:**
   - Role-based access control
   - Admin-only operations
   - Task creator permissions

3. **Input Validation:**
   - Client-side validation
   - Server-side constraints
   - SQL injection prevention (parameterized queries)

4. **Authentication:**
   - JWT tokens
   - Secure session management
   - Auto-refresh tokens

---

## Known Limitations & Future Work

### Not Yet Implemented (109 SP remaining)
1. **Notifications (EPIC 14 - 19 SP):**
   - Push notifications
   - In-app notification center
   - Notification preferences

2. **Additional Features:**
   - Due dates for tasks
   - Recurring tasks
   - Task categories/tags
   - File attachments
   - Calendar view

3. **Backend Automation:**
   - Captain rotation cron job (currently manual)
   - Automated streak updates
   - Badge award automation

4. **Testing:**
   - E2E tests with Detox
   - Additional unit tests
   - Performance benchmarks

### Technical Debt
- Some components could be further refactored
- Additional error boundary implementations
- More comprehensive offline support
- Image upload for messages (currently text-only)

---

## Development Guidelines

### Adding New Features
1. Create TypeScript interfaces in hook files
2. Implement React Query hooks for data fetching
3. Add Supabase queries with proper RLS policies
4. Create UI components with theme system
5. Add analytics tracking
6. Write integration tests
7. Update API-REFERENCE.md
8. Update DATABASE_SCHEMA.md if schema changes

### Commit Message Format
```
feat: Add feature name

- Feature detail 1
- Feature detail 2

Progress: X SP / 387 SP (Y.Z%)
```

### Testing Requirements
- Integration tests for all data hooks
- Mock Supabase responses
- Test success and error paths
- Test data transformations

---

## Deployment

### Prerequisites
- Expo account
- EAS CLI installed
- Supabase project configured
- Environment variables set

### Build Commands
```bash
# Development build
eas build --profile development --platform ios/android

# Preview build
eas build --profile preview --platform ios/android

# Production build
eas build --profile production --platform ios/android
```

### Environment Variables
Required in .env:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_SENTRY_DSN
- EXPO_PUBLIC_POSTHOG_API_KEY
- EXPO_PUBLIC_POSTHOG_HOST

---

## Contributors

This project was developed with assistance from Claude (Anthropic) as an AI pair programmer.

---

## License

[Add your license here]

---

## Contact & Support

[Add contact information]

---

**Last Updated:** 2025-01-23
**Version:** 0.7.2 (71.8% complete)
**Total Commits:** 25
