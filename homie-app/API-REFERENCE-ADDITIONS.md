# API Reference - Recent Additions

## Table of Contents
- [Notifications](#notifications)
- [Recurring Tasks](#recurring-tasks)
- [Performance Utilities](#performance-utilities)
- [UI Components](#ui-components)

---

## Notifications

### `useNotifications()`

Hook for managing push notifications.

```typescript
const {
  expoPushToken,
  notification,
  enableNotifications,
  disableNotifications,
} = useNotifications();
```

**Returns:**
- `expoPushToken`: Expo push token for this device
- `notification`: Current notification object
- `enableNotifications()`: Enable push notifications
- `disableNotifications()`: Disable push notifications

**Example:**
```typescript
import { useNotifications } from '@/hooks/useNotifications';

function SettingsScreen() {
  const { enableNotifications, disableNotifications } = useNotifications();

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  };
}
```

### `useNotificationHistory()`

Hook for accessing notification history.

```typescript
const {
  notifications,
  loading,
  dismissNotification,
  dismissAll,
  refresh,
} = useNotificationHistory();
```

---

## Recurring Tasks

### `useRecurringTasks()`

Fetch all recurring tasks for the household.

```typescript
const { data: recurringTasks, isLoading, error } = useRecurringTasks();
```

### `useCreateRecurringTask()`

Create a new recurring task.

```typescript
const createRecurringTask = useCreateRecurringTask();

await createRecurringTask.mutateAsync({
  title: 'Weekly Cleaning',
  description: 'Clean the living room',
  category: 'cleaning',
  estimated_minutes: 60,
  recurrence_rule: {
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: ['monday', 'friday'],
  },
});
```

**Recurrence Rule Options:**
```typescript
interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: DayOfWeek[]; // For weekly
  dayOfMonth?: number; // For monthly (1-31)
  endDate?: string; // ISO date
  endAfterOccurrences?: number; // Stop after N times
}
```

### `useGenerateRecurringTaskInstances()`

Generate task instances from recurring tasks.

```typescript
const generateInstances = useGenerateRecurringTaskInstances();

const result = await generateInstances.mutateAsync();
// Returns: { generated: number, tasks: Task[] }
```

---

## Performance Utilities

### `debounce(func, wait)`

Debounce a function to limit execution frequency.

```typescript
import { debounce } from '@/utils/performance-utils';

const handleSearch = debounce((query: string) => {
  // Search logic
}, 300);
```

### `throttle(func, limit)`

Throttle a function to execute at most once per interval.

```typescript
import { throttle } from '@/utils/performance-utils';

const handleScroll = throttle(() => {
  // Scroll logic
}, 100);
```

### `memoize(func)`

Memoize expensive function calls.

```typescript
import { memoize } from '@/utils/performance-utils';

const expensiveCalculation = memoize((input: number) => {
  // Heavy computation
  return result;
});
```

### `CacheManager`

Cache with TTL support.

```typescript
import { CacheManager } from '@/utils/performance-utils';

const cache = new CacheManager<string, UserData>(5); // 5 minute TTL

cache.set('user-123', userData);
const data = cache.get('user-123'); // Returns data or null if expired
```

---

## UI Components

### `LoadingState`

Reusable loading component.

```typescript
import { LoadingState } from '@/components/LoadingState';

<LoadingState message="Loading tasks..." size="large" fullScreen />
```

**Props:**
- `message?: string` - Loading message
- `size?: 'small' | 'large'` - Spinner size
- `fullScreen?: boolean` - Full screen loading

### `Skeleton`

Skeleton loader for shimmer effect.

```typescript
import { Skeleton } from '@/components/LoadingState';

<Skeleton width="100%" height={20} borderRadius={4} />
```

### `TaskCardSkeleton`

Pre-built skeleton for task cards.

```typescript
import { TaskCardSkeleton } from '@/components/LoadingState';

{isLoading && <TaskCardSkeleton />}
```

### `EmptyState`

Reusable empty state component.

```typescript
import { EmptyState } from '@/components/EmptyState';

<EmptyState
  icon="checkbox-outline"
  title="No Tasks"
  message="You don't have any tasks yet."
  actionLabel="Create Task"
  onAction={() => router.push('/create-task')}
/>
```

**Props:**
- `icon: string` - Ionicons icon name
- `title: string` - Empty state title
- `message: string` - Description message
- `actionLabel?: string` - Button text (optional)
- `onAction?: () => void` - Button callback (optional)
- `emoji?: string` - Emoji instead of icon (optional)

---

## Analytics Events

### New Events Added

**Notifications:**
- `NOTIFICATION_PERMISSION_GRANTED`
- `NOTIFICATION_PERMISSION_DENIED`
- `NOTIFICATION_RECEIVED`
- `NOTIFICATION_OPENED`
- `NOTIFICATION_DISMISSED`

**Usage:**
```typescript
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

trackEvent(ANALYTICS_EVENTS.NOTIFICATION_OPENED, {
  type: 'task_assigned',
  task_id: '123',
});
```

---

## Database Schema Updates

### New Tables

**recurring_tasks:**
```sql
CREATE TABLE recurring_tasks (
  id UUID PRIMARY KEY,
  household_id UUID REFERENCES households(id),
  title TEXT NOT NULL,
  recurrence_rule JSONB NOT NULL,
  next_occurrence_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  total_occurrences INTEGER DEFAULT 0,
  -- ... other fields
);
```

**New Fields:**
- `members.push_token` - Expo push notification token
- `tasks.recurring_task_id` - Reference to recurring task template

---

## Query Configuration

### Optimized Defaults

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Benefits:**
- Reduced unnecessary refetches
- Better cache utilization
- Improved performance
- Lower bandwidth usage
