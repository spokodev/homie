# HOMIE - Claude Code Implementation Prompts

## Initial Setup Prompt

Create a React Native Expo app for a household management gamification app called Homie. 

Tech stack:
- Expo SDK 51 with TypeScript
- Supabase for backend (auth, database, realtime)
- Zustand for global state management
- React Query for server state
- React Navigation (Expo Router)
- React Native Reanimated 3 for animations
- PostHog for analytics
- Sentry for error tracking
- RevenueCat for subscriptions

The app should follow the provided design system with:
- Coral red (#FF6B6B) as primary color
- Teal (#4ECDC4) as secondary
- Yellow (#FFD93D) as accent
- Cabinet Grotesk for headings, Inter for body text

## Database Setup Prompt

Set up Supabase with the following schema:

Tables needed:
- households (name, icon, settings)
- members (name, avatar, type[human/pet], role, points, level)
- rooms (name, icon, household_id)
- tasks (title, description, room, assignee, points, status, timers)
- cleaning_captains (weekly rotation assignments)
- captain_ratings (peer feedback with stars and comments)
- room_notes (sticky notes attached to rooms)
- messages (family chat)
- points_ledger (gamification tracking)
- badges & member_badges (achievements)
- subscriptions (premium features)

Enable Row Level Security on all tables. Users should only access their household's data.

## Authentication Flow Prompt

Implement authentication with:
1. Welcome screen with mascot animation
2. Email/password signup
3. Login screen
4. Password reset flow
5. Onboarding: name → create/join household → add members → first captain
6. Store user session in Zustand
7. Auto-login if session exists
8. Protected routes using Expo Router

## Home Dashboard Prompt

Create the main home screen with:
- Header showing household name and settings icon
- Current Cleaning Captain card with avatar and days remaining
- "My Tasks Today" section showing up to 3 tasks
- Quick stats: points, current streak, weekly rank
- Quick action buttons: Add Task, Rate Captain (if available)
- Bottom navigation with 5 tabs: Home, Rooms, Chat, Leaderboard, Profile

Implement pull-to-refresh and optimistic UI updates.

## Task Management Prompt

Build task system with:
1. Task list screen with tabs (All, Mine, Completed)
2. Create task modal with fields: title, description, room, assignee, points, due date, estimated time
3. Task card showing: title, room badge, assignee avatar, points, due date
4. Task timer feature: start/pause/complete with actual time tracking
5. On complete: satisfaction rating (1-5 stars) and points animation
6. Quick templates for common chores
7. Recurring task patterns

Use optimistic updates for smooth UX.

## Cleaning Captain System Prompt

Implement weekly captain rotation:
1. Captain schedule screen showing upcoming weeks
2. Auto-assignment algorithm (fair distribution)
3. Manual override for vacations/exceptions
4. Current captain banner on home screen
5. End-of-week rating trigger
6. Captain responsibilities display
7. Historical captain performance

## Rating System Prompt

Build the peer rating feature:
1. Rating notification when week ends
2. Star rating (1-5) with haptic feedback
3. Free version: simple text feedback
4. Premium: structured feedback with categories
   - What went well (chip selection)
   - Areas to improve (chip selection)
   - Overall comment
   - Private note (only rated person sees)
5. Category ratings (premium): cleanliness, timeliness, quality, communication, initiative
6. Results screen showing average rating and aggregated feedback
7. Points calculation: stars × 20

## Room Notes Feature Prompt

Create sticky notes system:
1. Rooms grid screen (2 columns)
2. Room detail with sticky notes
3. Add note with: text, color (yellow/blue/pink/green), optional photo
4. Pin important notes to top
5. Free: 3 notes per room
6. Premium: unlimited notes with photos
7. Note expiration dates
8. Edit/delete own notes

## Family Chat Prompt

Implement real-time chat:
1. Messages list with bubble UI
2. Text input with send button
3. Image picker and sharing
4. System messages for achievements
5. Typing indicators
6. Read receipts
7. Link previews for tasks/notes
8. Real-time updates using Supabase subscriptions

## Gamification System Prompt

Build points and achievements:
1. Points for: task completion, speed bonus, ratings, streaks
2. 50 levels (Free: 1-20, Premium: 21-50)
3. XP calculation: 100 points per level
4. Daily/weekly streak tracking
5. 20 badges (5 free, 15 premium)
6. Leaderboard with podium display
7. Pet champions section
8. Achievement unlock animations with haptic
9. Level up celebration effect

## Premium Features Prompt

Implement freemium model:
1. Paywall screen with benefits
2. RevenueCat integration for $4.99/month
3. Premium features:
   - Detailed rating feedback
   - Levels 21-50
   - 15 additional badges
   - Speed bonuses
   - Unlimited notes with photos
   - Weekly reports
   - Custom avatars
   - Alternative app icons
4. Restore purchases functionality
5. Premium badge on profile

## Profile & Settings Prompt

Create profile section:
1. Avatar with edit capability
2. Name and level display
3. Stats grid: points, streak, tasks, rating
4. Badge collection display
5. Settings menu:
   - Notifications
   - Account
   - Household settings
   - Premium upgrade
   - Help & feedback
   - Sign out
6. Data export (premium)

## Animations & Polish Prompt

Add delightful animations:
1. Task completion: checkbox fill, confetti, points counter
2. Level up: screen flash, particles, badge grow
3. Rating submit: stars pulse, success checkmark
4. Streak milestone: fire animation
5. Screen transitions using Reanimated
6. Haptic feedback on all interactions
7. Loading states with skeleton screens
8. Pull-to-refresh animations
9. Empty states with illustrations

## State Management Prompt

Set up Zustand stores:
```typescript
- useAuthStore: user, session, login/logout
- useHouseholdStore: household, members, settings
- useTaskStore: tasks, filters, CRUD operations
- useCaptainStore: schedule, current captain
- useRatingStore: ratings, submission
- useChatStore: messages, typing, presence
- useGameStore: points, level, badges, leaderboard
```

Use React Query for:
- Data fetching with cache
- Optimistic updates
- Background refetch
- Infinite scroll

## Testing & Error Handling Prompt

Implement:
1. Try-catch blocks on all async operations
2. Error boundaries for screen crashes
3. Sentry integration for error tracking
4. Input validation with clear error messages
5. Network error handling with retry
6. Offline mode with queue system
7. Loading states on all async operations
8. Empty states for no data
9. User-friendly error messages

## Performance Optimization Prompt

Optimize for smooth 60fps:
1. FlatList with getItemLayout
2. Image caching and optimization
3. Lazy loading for heavy screens
4. Memoization with React.memo
5. useCallback and useMemo where needed
6. Debounce search inputs
7. Virtualized lists for long content
8. Minimize re-renders
9. Bundle size optimization

## Final Polish Prompt

Complete the app with:
1. App icon and splash screen
2. Push notifications setup
3. Deep linking support
4. Analytics events tracking
5. Accessibility labels
6. Internationalization ready
7. App Store screenshots
8. Privacy policy and terms
9. Beta testing setup
10. Production build configuration