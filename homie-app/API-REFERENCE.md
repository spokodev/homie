# HomieLife API Reference

Complete reference guide for all hooks, utilities, and contexts in the HomieLife app.

## Table of Contents
- [Authentication](#authentication)
- [Tasks](#tasks)
- [Messages](#messages)
- [Rooms & Notes](#rooms--notes)
- [Badges](#badges)
- [Captain & Ratings](#captain--ratings)
- [Analytics](#analytics)
- [Performance](#performance)
- [Utilities](#utilities)

---

## Authentication

### `useAuth()`
Main authentication context hook.

**Returns:**
```typescript
{
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{error, data}>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{error, data}>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{error}>;
}
```

**Usage:**
```typescript
const { user, signIn, signOut } = useAuth();

// Sign in
await signIn('user@example.com', 'password123');

// Sign out
await signOut();
```

---

## Tasks

### `useTasks(householdId?)`
Fetch all tasks for a household.

**Parameters:**
- `householdId` (optional): UUID of the household

**Returns:**
```typescript
{
  data: Task[];
  isLoading: boolean;
  error: Error | null;
}
```

**Usage:**
```typescript
const { data: tasks, isLoading } = useTasks(household?.id);
```

### `useMyTasks(householdId?, memberId?)`
Fetch tasks assigned to me or unassigned.

**Parameters:**
- `householdId` (optional): UUID of the household
- `memberId` (optional): UUID of the member

**Usage:**
```typescript
const { data: myTasks } = useMyTasks(household?.id, member?.id);
```

### `useCreateTask()`
Create a new task.

**Usage:**
```typescript
const createTask = useCreateTask();

await createTask.mutateAsync({
  title: 'Clean kitchen',
  description: 'Wipe counters and sweep floor',
  household_id: 'uuid',
  created_by_member_id: 'uuid',
  estimated_minutes: 30,
  assignee_id: 'uuid', // optional
  due_date: '2024-01-15T10:00:00Z', // optional
  room: 'Kitchen', // optional
});
```

### `useUpdateTask()`
Update an existing task.

**Usage:**
```typescript
const updateTask = useUpdateTask();

await updateTask.mutateAsync({
  id: 'task-uuid',
  updates: {
    title: 'New title',
    status: 'in_progress',
    assignee_id: 'uuid',
  },
});
```

### `useCompleteTask()`
Complete a task and award points.

**Usage:**
```typescript
const completeTask = useCompleteTask();

await completeTask.mutateAsync({
  taskId: 'uuid',
  actualMinutes: 25, // optional
});
```

### `useDeleteTask()`
Delete a task.

**Usage:**
```typescript
const deleteTask = useDeleteTask();

await deleteTask.mutateAsync('task-uuid');
```

---

## Messages

### `useMessages(householdId?)`
Fetch messages with real-time updates.

**Features:**
- Real-time subscription via Supabase Realtime
- Auto-updates on new messages
- Includes member details (name, avatar)
- Ordered oldest to newest

**Usage:**
```typescript
const { data: messages, isLoading } = useMessages(household?.id);

// Messages are automatically updated in real-time
```

### `useSendMessage()`
Send a new message.

**Features:**
- Optimistic updates
- Real-time sync

**Usage:**
```typescript
const sendMessage = useSendMessage();

await sendMessage.mutateAsync({
  household_id: 'uuid',
  member_id: 'uuid',
  content: 'Hello family!',
  type: 'text', // 'text' | 'image' | 'system'
  image_url: 'https://...', // optional
});
```

### `useDeleteMessage()`
Delete a message (admin only).

**Usage:**
```typescript
const deleteMessage = useDeleteMessage();

await deleteMessage.mutateAsync({
  messageId: 'uuid',
  householdId: 'uuid',
});
```

---

## Rooms & Notes

### `useRooms(householdId?)`
Fetch all rooms with notes count.

**Usage:**
```typescript
const { data: rooms } = useRooms(household?.id);

// rooms[0].notes_count - number of notes in room
```

### `useRoom(roomId?)`
Fetch a single room.

**Usage:**
```typescript
const { data: room } = useRoom('room-uuid');
```

### `useCreateRoom()`
Create a new room.

**Usage:**
```typescript
const createRoom = useCreateRoom();

await createRoom.mutateAsync({
  household_id: 'uuid',
  name: 'Living Room',
  icon: '🛋️',
});
```

### `useUpdateRoom()`
Update a room.

**Usage:**
```typescript
const updateRoom = useUpdateRoom();

await updateRoom.mutateAsync({
  id: 'room-uuid',
  updates: {
    name: 'Living Area',
    icon: '🏠',
  },
});
```

### `useDeleteRoom()`
Delete a room (deletes all notes).

**Usage:**
```typescript
const deleteRoom = useDeleteRoom();

await deleteRoom.mutateAsync({
  roomId: 'uuid',
  householdId: 'uuid',
});
```

### `useRoomNotes(roomId?)`
Fetch notes for a room.

**Features:**
- Pinned notes first
- Includes member details
- Ordered by created_at

**Usage:**
```typescript
const { data: notes } = useRoomNotes('room-uuid');
```

### `useCreateRoomNote()`
Create a sticky note.

**Features:**
- Free user limit: 3 notes per room
- Premium: unlimited

**Usage:**
```typescript
const createNote = useCreateRoomNote();

await createNote.mutateAsync({
  room_id: 'uuid',
  member_id: 'uuid',
  content: 'Remember to water plants',
  color: '#FFD93D', // optional, defaults to yellow
  is_pinned: false, // optional
  expires_at: '2024-12-31', // optional
});
```

### `useTogglePinNote()`
Pin/unpin a note.

**Usage:**
```typescript
const togglePin = useTogglePinNote();

await togglePin.mutateAsync({
  id: 'note-uuid',
  roomId: 'room-uuid',
  isPinned: true,
});
```

### `useDeleteRoomNote()`
Delete a note.

**Usage:**
```typescript
const deleteNote = useDeleteRoomNote();

await deleteNote.mutateAsync({
  noteId: 'uuid',
  roomId: 'uuid',
});
```

---

## Badges

### `useMemberBadges(memberId?)`
Fetch badges earned by a member.

**Usage:**
```typescript
const { data: badges } = useMemberBadges(member?.id);
```

### `useAwardBadge()`
Award a badge to a member.

**Features:**
- Checks if already earned
- Auto-skips duplicates

**Usage:**
```typescript
const awardBadge = useAwardBadge();

await awardBadge.mutateAsync({
  memberId: 'uuid',
  badgeId: 'first_task',
});
```

### `useGroupedBadges(memberId?, isPremium?)`
Get badges grouped by earned/locked.

**Usage:**
```typescript
const { data } = useGroupedBadges(member?.id, isPremium);
// data = { earned: Badge[], locked: Badge[] }
```

### `useBadgeStats(memberId?, isPremium?)`
Get badge statistics.

**Usage:**
```typescript
const { data } = useBadgeStats(member?.id, isPremium);
// data = { earnedCount: number, totalCount: number }
```

### `getBadgeProgress(badgeId, memberStats)`
Get progress toward a badge.

**Usage:**
```typescript
import { getBadgeProgress } from '@/utils/badges';

const progress = getBadgeProgress('marathon', {
  tasksCompleted: 35,
  // ... other stats
});
// progress = "35/50"
```

---

## Captain & Ratings

### `useCaptain(householdId?)`
Get the current captain for a household.

**Returns:**
```typescript
{
  id: string;
  name: string;
  avatar: string;
  started_at: string;
  ends_at: string;
  days_left: number;
  total_ratings: number;
  average_rating: number | null;
  times_captain: number;
}
```

**Usage:**
```typescript
const { data: captain, isLoading } = useCaptain(household?.id);

if (captain) {
  console.log(`${captain.name} has ${captain.days_left} days left`);
  console.log(`Average rating: ${captain.average_rating}/5`);
}
```

### `useRotateCaptain()`
Rotate to the next captain (manual or automatic selection).

**Features:**
- Auto-selects member who has been captain least often
- Can manually specify next captain
- Tracks rotation history
- Awards analytics event

**Usage:**
```typescript
const rotateCaptain = useRotateCaptain();

// Auto-select next captain
await rotateCaptain.mutateAsync({
  household_id: 'uuid',
});

// Manually select captain
await rotateCaptain.mutateAsync({
  household_id: 'uuid',
  next_captain_id: 'member-uuid',
});
```

### `useCaptainStats(memberId?)`
Get captain statistics for a member.

**Usage:**
```typescript
const { data: stats } = useCaptainStats(member?.id);
// stats = { times_captain: number, average_rating: number | null }
```

### `useRateCaptain()`
Submit a rating for the current captain.

**Features:**
- Validates rating (1-5 stars)
- Prevents duplicate ratings
- Awards bonus points for high ratings (4-5 stars)
- Updates household and member stats

**Usage:**
```typescript
const rateCaptain = useRateCaptain();

await rateCaptain.mutateAsync({
  household_id: 'uuid',
  captain_member_id: 'uuid',
  rated_by_member_id: 'uuid',
  rating: 5, // 1-5
  comment: 'Great job!', // optional
  rotation_start: '2024-01-01T00:00:00Z',
  rotation_end: '2024-01-08T00:00:00Z',
});
```

### `useHasRatedCaptain(householdId?, captainId?, memberId?, rotationStart?)`
Check if current member has already rated the captain for this rotation.

**Usage:**
```typescript
const { data: hasRated } = useHasRatedCaptain(
  household?.id,
  captain?.id,
  member?.id,
  captain?.started_at
);

if (hasRated) {
  // Show "Already rated" message
}
```

### `useCaptainRotationRatings(captainId?, rotationStart?)`
Get all ratings for a specific captain rotation.

**Usage:**
```typescript
const { data: ratings } = useCaptainRotationRatings(
  captain?.id,
  captain?.started_at
);
```

### `useCaptainRatingHistory(captainId?)`
Get rating history for a captain (all rotations).

**Usage:**
```typescript
const { data: history } = useCaptainRatingHistory(member?.id);
// Returns last 50 ratings
```

---

## Analytics

### `trackEvent(eventName, properties?)`
Track a custom event.

**Usage:**
```typescript
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

trackEvent(ANALYTICS_EVENTS.TASK_CREATED, {
  points: 10,
  has_assignee: true,
});
```

### `identifyUser(userId, properties?)`
Identify a user for analytics.

**Usage:**
```typescript
import { identifyUser } from '@/utils/analytics';

identifyUser('user-123', {
  email: 'user@example.com',
  name: 'John Doe',
  household_size: 4,
  premium_status: true,
});
```

### `trackScreenView(screenName, properties?)`
Track a screen view.

**Usage:**
```typescript
import { trackScreenView } from '@/utils/analytics';

trackScreenView('Home Screen', {
  tab: 'tasks',
});
```

### `trackTaskEvent(eventName, taskData)`
Track a task-related event.

**Usage:**
```typescript
import { trackTaskEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

trackTaskEvent(ANALYTICS_EVENTS.TASK_COMPLETED, {
  task_id: 'uuid',
  points: 15,
  status: 'completed',
});
```

### `trackPremiumEvent(eventName, data?)`
Track a premium conversion event.

**Usage:**
```typescript
import { trackPremiumEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

trackPremiumEvent(ANALYTICS_EVENTS.PREMIUM_PURCHASE, {
  plan: 'yearly',
  price: 49.99,
  source: 'settings',
});
```

---

## Performance

### `useNavigationPerformance(screenName?)`
Auto-track screen performance.

**Usage:**
```typescript
import { useNavigationPerformance } from '@/hooks/useNavigationPerformance';

function MyScreen() {
  useNavigationPerformance('My Screen');
  // Automatically tracks load time and screen view

  return <View>...</View>;
}
```

### `trackScreenLoad(screenName)`
Manually track screen load.

**Usage:**
```typescript
import { trackScreenLoad } from '@/utils/performance';

const tracker = trackScreenLoad('Settings');
// ... do work
tracker.finish();
```

### `trackAPIRequest(endpoint, method?)`
Track API request performance.

**Usage:**
```typescript
import { trackAPIRequest } from '@/utils/performance';

const tracker = trackAPIRequest('/api/tasks', 'GET');
const response = await fetch('/api/tasks');
tracker.finish(response.status);
```

### `measureAsync(name, fn)`
Measure async function execution.

**Usage:**
```typescript
import { measureAsync } from '@/utils/performance';

const data = await measureAsync('loadUserData', async () => {
  return await fetchUserData();
});
```

---

## Utilities

### Validation

```typescript
import {
  validateEmail,
  validatePassword,
  validateTaskTitle,
  validateTaskDescription,
  validateHouseholdName,
  validateMemberName,
  validateRoomName,
} from '@/utils/validation';

const result = validateEmail('test@example.com');
// result = { isValid: true } | { isValid: false, error: 'message' }
```

### Error Handling

```typescript
import { logError, parseSupabaseError } from '@/utils/errorHandling';

try {
  await operation();
} catch (error) {
  logError(error, 'Operation Context');
  // Logs to console in dev, Sentry in production
}
```

### Gamification

```typescript
import { calculateLevel, calculatePoints } from '@/utils/gamification';

const level = calculateLevel(1250); // Returns level number
const pointsForNext = calculatePoints(level + 1); // Points needed for next level
```

### Permissions

```typescript
import { MemberPermissions } from '@/utils/permissions';

const canEdit = MemberPermissions.canEditTask(member, taskCreatorId);
// Returns: { allowed: true } | { allowed: false, reason: 'message' }

const canDelete = MemberPermissions.canDeleteMember(member, targetMemberId);
```

---

## Constants

### Room Presets

```typescript
import { ROOM_PRESETS } from '@/constants';

// ROOM_PRESETS = [
//   { id: '1', name: 'Living Room', icon: '🛋️' },
//   { id: '2', name: 'Kitchen', icon: '🍳' },
//   ...
// ]
```

### Badges

```typescript
import { BADGES } from '@/constants';

// BADGES = {
//   free: [...5 badges],
//   premium: [...15 badges]
// }
```

### App Config

```typescript
import { APP_CONFIG } from '@/constants';

// APP_CONFIG.pricing.premium.monthly
// APP_CONFIG.limits.free.notesPerRoom
// APP_CONFIG.game.pointsPerLevel
```

---

## Error Codes

Common Supabase error codes:

- `PGRST116` - Not found
- `23505` - Unique constraint violation
- `23503` - Foreign key violation
- `42501` - Insufficient privilege

---

## Best Practices

### 1. Always handle loading and error states

```typescript
const { data, isLoading, error } = useTasks(household?.id);

if (isLoading) return <ActivityIndicator />;
if (error) return <ErrorMessage />;
return <TaskList tasks={data} />;
```

### 2. Use optimistic updates for better UX

```typescript
// React Query automatically handles this in mutations
const createTask = useCreateTask();
await createTask.mutateAsync(newTask);
// UI updates immediately, reverts on error
```

### 3. Track analytics for key user actions

```typescript
await createTask.mutateAsync(data);
trackEvent(ANALYTICS_EVENTS.TASK_CREATED, { points: 10 });
```

### 4. Use TypeScript types

```typescript
import { Task, Message, Room, Badge } from '@/hooks/...';

const task: Task = {...};
```

### 5. Clean up subscriptions

```typescript
useEffect(() => {
  const subscription = supabase.channel(...);
  return () => subscription.unsubscribe();
}, []);
```

---

## Support

For issues or questions:
- Check inline code documentation
- Review test files in `__tests__` directories
- Email: hello@tryhomie.app
