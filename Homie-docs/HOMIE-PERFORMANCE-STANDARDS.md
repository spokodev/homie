# Homie Performance Standards & Optimization Guide

## Executive Summary

This document defines performance standards, optimization strategies, and monitoring requirements for the Homie application. Our goal is to deliver a fast, responsive experience that delights users and supports scale to 10,000+ concurrent users.

## Performance Budgets

### Load Time Targets

```typescript
interface PerformanceBudgets {
  // App Launch
  coldStart: {
    target: 2000;      // 2 seconds
    critical: 3000;    // 3 seconds max
  };

  warmStart: {
    target: 800;       // 800ms
    critical: 1500;    // 1.5 seconds max
  };

  // Screen Transitions
  navigation: {
    target: 200;       // 200ms
    critical: 400;     // 400ms max
  };

  // API Responses
  api: {
    p50: 200;         // 50th percentile: 200ms
    p95: 500;         // 95th percentile: 500ms
    p99: 1000;        // 99th percentile: 1 second
  };

  // Image Loading
  imageDisplay: {
    thumbnail: 500;    // 500ms for thumbnails
    fullSize: 1000;   // 1 second for full images
  };

  // Bundle Size
  bundle: {
    initial: 3000;     // 3MB initial download
    total: 10000;      // 10MB total app size
  };

  // Memory Usage
  memory: {
    average: 150;      // 150MB average
    peak: 300;         // 300MB peak
  };
}
```

### Metrics to Track

```typescript
export class PerformanceMetrics {
  // Core Web Vitals (adapted for mobile)
  static readonly METRICS = {
    // Time to Interactive (TTI)
    TTI: {
      measurement: 'Time until app is fully interactive',
      target: '<2s',
      tool: 'React Native Performance Monitor',
    },

    // First Contentful Paint (FCP)
    FCP: {
      measurement: 'Time to first content render',
      target: '<1s',
      tool: 'Custom markers',
    },

    // Largest Contentful Paint (LCP)
    LCP: {
      measurement: 'Time to largest content element',
      target: '<2.5s',
      tool: 'Custom markers',
    },

    // First Input Delay (FID)
    FID: {
      measurement: 'Delay between user input and response',
      target: '<100ms',
      tool: 'User interaction tracking',
    },

    // Cumulative Layout Shift (CLS)
    CLS: {
      measurement: 'Visual stability score',
      target: '<0.1',
      tool: 'Layout change detection',
    },
  };

  // Custom metrics
  static trackCustomMetrics() {
    return {
      taskCompletionTime: 'Time from button press to confirmation',
      leaderboardLoadTime: 'Time to display leaderboard',
      chatMessageDelivery: 'Time from send to delivered',
      imageUploadTime: 'Time to upload and display image',
      syncCompletionTime: 'Time to sync offline changes',
    };
  }
}
```

### Performance Monitoring Implementation

```typescript
import analytics from '@react-native-firebase/analytics';
import { PerformanceObserver } from 'react-native-performance';

export class PerformanceMonitor {
  private static startTime: number;
  private static marks: Map<string, number> = new Map();

  // Mark app start
  static markAppStart() {
    this.startTime = Date.now();
  }

  // Mark a performance point
  static mark(name: string) {
    this.marks.set(name, Date.now());
  }

  // Measure between marks
  static measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark) || this.startTime;
    const end = endMark ? this.marks.get(endMark) : Date.now();
    const duration = end - start;

    // Send to analytics
    analytics().logEvent('performance_measure', {
      metric_name: name,
      duration_ms: duration,
    });

    // Log if exceeds budget
    if (duration > PerformanceBudgets[name]?.critical) {
      console.warn(`Performance budget exceeded for ${name}: ${duration}ms`);
      this.reportBudgetViolation(name, duration);
    }

    return duration;
  }

  // Monitor JS thread
  static monitorJSThread() {
    let lastFrameTime = Date.now();

    const checkFrame = () => {
      const now = Date.now();
      const delta = now - lastFrameTime;

      if (delta > 16.67) { // 60fps = 16.67ms per frame
        this.reportFrameDrop(delta);
      }

      lastFrameTime = now;
      requestAnimationFrame(checkFrame);
    };

    requestAnimationFrame(checkFrame);
  }
}
```

## Frontend Optimization

### Image Optimization

```typescript
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export class ImageOptimizer {
  // Image sizing strategy
  static readonly IMAGE_SIZES = {
    thumbnail: { width: 150, height: 150 },
    small: { width: 400, height: 400 },
    medium: { width: 800, height: 800 },
    large: { width: 1200, height: 1200 },
  };

  // Optimize image before upload
  static async optimizeForUpload(uri: string): Promise<string> {
    const optimized = await manipulateAsync(
      uri,
      [
        { resize: { width: 1200 } }, // Max width
      ],
      {
        compress: 0.8,              // 80% quality
        format: SaveFormat.JPEG,    // Convert to JPEG
      }
    );

    return optimized.uri;
  }

  // Generate blurhash for placeholder
  static async generateBlurhash(uri: string): Promise<string> {
    // Implementation using blurhash library
    const blurhash = await Blurhash.encode(uri, 4, 3);
    return blurhash;
  }

  // Cached image component
  static CachedImage = ({ source, style, ...props }) => {
    return (
      <Image
        source={source}
        style={style}
        cachePolicy="memory-disk"    // Cache in memory and disk
        transition={200}              // Fade in animation
        placeholder={props.blurhash}  // Show blurhash while loading
        contentFit="cover"
        recyclingKey={source.uri}     // Reuse image views
        {...props}
      />
    );
  };
}

// Image processing pipeline
export class ImagePipeline {
  // Process uploaded image
  static async processUpload(imageUri: string, userId: string) {
    // 1. Optimize original
    const optimized = await ImageOptimizer.optimizeForUpload(imageUri);

    // 2. Generate thumbnails
    const thumbnails = await this.generateThumbnails(optimized);

    // 3. Generate blurhash
    const blurhash = await ImageOptimizer.generateBlurhash(optimized);

    // 4. Upload to CDN
    const urls = await this.uploadToCDN(thumbnails, userId);

    // 5. Cache locally
    await this.cacheLocally(urls);

    return {
      urls,
      blurhash,
    };
  }

  // Generate multiple sizes
  static async generateThumbnails(uri: string) {
    const sizes = {};

    for (const [name, dimensions] of Object.entries(ImageOptimizer.IMAGE_SIZES)) {
      sizes[name] = await manipulateAsync(
        uri,
        [{ resize: dimensions }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
    }

    return sizes;
  }
}
```

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';

// Lazy load heavy screens
const PremiumScreen = lazy(() =>
  import(/* webpackChunkName: "premium" */ '@/screens/Premium')
);

const AnalyticsScreen = lazy(() =>
  import(/* webpackChunkName: "analytics" */ '@/screens/Analytics')
);

const SettingsScreen = lazy(() =>
  import(/* webpackChunkName: "settings" */ '@/screens/Settings')
);

// Lazy load heavy libraries
const loadChartLibrary = () =>
  import(/* webpackChunkName: "charts" */ 'react-native-chart-kit');

const loadImagePicker = () =>
  import(/* webpackChunkName: "image-picker" */ 'expo-image-picker');

// Route-based code splitting
export const Routes = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Core screens loaded immediately */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Tasks" component={TasksScreen} />

        {/* Premium features loaded on demand */}
        <Stack.Screen name="Premium">
          {() => (
            <Suspense fallback={<LoadingScreen />}>
              <PremiumScreen />
            </Suspense>
          )}
        </Stack.Screen>

        <Stack.Screen name="Analytics">
          {() => (
            <Suspense fallback={<LoadingScreen />}>
              <AnalyticsScreen />
            </Suspense>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Dynamic imports for features
export const loadPremiumFeatures = async () => {
  const modules = await Promise.all([
    import('./features/AdvancedAnalytics'),
    import('./features/CustomReports'),
    import('./features/DataExport'),
  ]);

  return modules;
};
```

### Memory Management

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { InteractionManager } from 'react-native';

export class MemoryManager {
  private static listeners: Set<() => void> = new Set();

  // Monitor memory usage
  static startMonitoring() {
    if (__DEV__) {
      setInterval(() => {
        const usage = performance.memory;

        if (usage.usedJSHeapSize > 150 * 1024 * 1024) { // 150MB
          console.warn('High memory usage:', usage.usedJSHeapSize / 1024 / 1024, 'MB');
          this.triggerCleanup();
        }
      }, 10000); // Check every 10 seconds
    }
  }

  // Register cleanup listener
  static addCleanupListener(listener: () => void) {
    this.listeners.add(listener);
  }

  // Trigger cleanup
  static triggerCleanup() {
    this.listeners.forEach(listener => listener());
  }
}

// Cleanup hook for components
export function useCleanup() {
  const cleanupRef = useRef<() => void>();

  useEffect(() => {
    const cleanup = () => {
      cleanupRef.current?.();
    };

    MemoryManager.addCleanupListener(cleanup);

    return () => {
      // Remove listener on unmount
      MemoryManager.listeners.delete(cleanup);
    };
  }, []);

  return useCallback((cleanupFn: () => void) => {
    cleanupRef.current = cleanupFn;
  }, []);
}

// Clean up subscriptions properly
export function useSubscription(channel: string) {
  const subscription = useRef(null);

  useEffect(() => {
    // Create subscription
    subscription.current = supabase
      .channel(channel)
      .on('*', handleEvent)
      .subscribe();

    // Cleanup on unmount
    return () => {
      subscription.current?.unsubscribe();
      subscription.current = null; // Clear reference
    };
  }, [channel]);

  return subscription.current;
}

// Prevent memory leaks in lists
export function useOptimizedFlatList<T>(data: T[]) {
  const listRef = useRef(null);

  // Clear images from memory when scrolling
  const handleScroll = useCallback((event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;

    // Calculate visible range
    const visibleStart = contentOffset.y;
    const visibleEnd = contentOffset.y + layoutMeasurement.height;

    // Clear images outside visible range
    Image.clearMemoryCache();
  }, []);

  return {
    ref: listRef,
    onScroll: handleScroll,
    removeClippedSubviews: true,     // Remove offscreen views
    maxToRenderPerBatch: 10,          // Render in smaller batches
    updateCellsBatchingPeriod: 50,   // Batch updates
    windowSize: 10,                   // Render 10 screens worth
    initialNumToRender: 10,           // Initial render count
  };
}
```

### React Query Optimization

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Optimized query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      staleTime: 5 * 60 * 1000,      // Data is fresh for 5 minutes
      cacheTime: 10 * 60 * 1000,     // Cache for 10 minutes

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error.status >= 400 && error.status < 500) return false;
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Background refetch
      refetchOnWindowFocus: false,    // Don't refetch on app focus
      refetchOnReconnect: 'always',   // Refetch when reconnected
      refetchInterval: false,         // No automatic refetch

      // Performance
      structuralSharing: true,        // Only re-render changed data
      keepPreviousData: true,         // Keep old data while fetching
    },

    mutations: {
      retry: 1,                       // Retry failed mutations once
      retryDelay: 1000,              // Wait 1 second before retry
    },
  },
});

// Prefetch critical data
export const prefetchCriticalData = async (householdId: string) => {
  await Promise.all([
    queryClient.prefetchQuery(['tasks', householdId], fetchTasks),
    queryClient.prefetchQuery(['members', householdId], fetchMembers),
    queryClient.prefetchQuery(['currentCaptain', householdId], fetchCurrentCaptain),
  ]);
};

// Optimistic updates
export const useOptimisticTask = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (task: Task) => createTask(task),
    {
      // Optimistically update the cache
      onMutate: async (newTask) => {
        await queryClient.cancelQueries(['tasks']);

        const previousTasks = queryClient.getQueryData(['tasks']);

        queryClient.setQueryData(['tasks'], old => [...old, newTask]);

        return { previousTasks };
      },

      // Rollback on error
      onError: (err, newTask, context) => {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      },

      // Invalidate and refetch on success
      onSettled: () => {
        queryClient.invalidateQueries(['tasks']);
      },
    }
  );
};

// Infinite query for pagination
export const useInfiniteTasks = (filters: TaskFilters) => {
  return useInfiniteQuery(
    ['tasks', filters],
    ({ pageParam = 0 }) => fetchTasksPaginated({ ...filters, offset: pageParam }),
    {
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.hasMore) {
          return pages.length * PAGE_SIZE;
        }
        return undefined;
      },

      // Keep pages in cache
      cacheTime: 30 * 60 * 1000,     // 30 minutes
      staleTime: 5 * 60 * 1000,      // 5 minutes

      // Refetch configuration
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
};
```

## Backend Optimization

### Database Query Optimization

```sql
-- Optimized query for leaderboard with proper indexes
EXPLAIN ANALYZE
SELECT
  m.id,
  m.name,
  m.avatar,
  m.points,
  m.level,
  COUNT(DISTINCT t.id) as tasks_completed,
  AVG(cr.stars) as avg_rating,
  ROW_NUMBER() OVER (ORDER BY m.points DESC) as rank
FROM members m
LEFT JOIN tasks t ON t.completed_by = m.id AND t.status = 'completed'
LEFT JOIN cleaning_captains cc ON cc.member_id = m.id
LEFT JOIN captain_ratings cr ON cr.captain_id = cc.id
WHERE m.household_id = $1
GROUP BY m.id
ORDER BY m.points DESC
LIMIT 20;

-- Create covering index for common query
CREATE INDEX idx_members_household_points
ON members(household_id, points DESC)
INCLUDE (name, avatar, level);

-- Partial index for active tasks
CREATE INDEX idx_tasks_active
ON tasks(household_id, assigned_to, status)
WHERE status = 'pending';

-- Use EXPLAIN ANALYZE to verify performance
-- Target: <50ms for all user-facing queries
```

### Supabase Edge Functions Optimization

```typescript
// Edge function with optimizations
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  // Early return for OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body once
    const body = await req.json();

    // Validate input early
    if (!body.userId || !body.taskId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use connection pooling
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      {
        db: {
          poolSize: 10,           // Connection pool
        },
        auth: {
          persistSession: false,  // Don't persist in Edge Functions
        },
      }
    );

    // Batch database operations
    const [task, member, household] = await Promise.all([
      supabase.from('tasks').select('*').eq('id', body.taskId).single(),
      supabase.from('members').select('*').eq('user_id', body.userId).single(),
      supabase.from('households').select('*').eq('id', body.householdId).single(),
    ]);

    // Process and return
    const result = processData(task, member, household);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        }
      }
    );
  } catch (error) {
    // Log error for monitoring
    console.error('Edge function error:', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper for CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Caching Strategy Implementation

```typescript
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

export class CacheManager {
  private redis: Redis;
  private memoryCache: LRUCache<string, any>;

  constructor() {
    // Redis for distributed cache
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    });

    // In-memory LRU cache for hot data
    this.memoryCache = new LRUCache({
      max: 500,                       // Maximum 500 items
      ttl: 1000 * 60 * 5,            // 5 minutes TTL
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  // Multi-layer cache get
  async get(key: string): Promise<any> {
    // Check memory cache first
    const memCached = this.memoryCache.get(key);
    if (memCached) {
      return memCached;
    }

    // Check Redis
    const redisCached = await this.redis.get(key);
    if (redisCached) {
      const parsed = JSON.parse(redisCached);
      // Populate memory cache
      this.memoryCache.set(key, parsed);
      return parsed;
    }

    return null;
  }

  // Multi-layer cache set
  async set(key: string, value: any, ttl: number = 300) {
    // Set in memory cache
    this.memoryCache.set(key, value);

    // Set in Redis with TTL
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  // Cache warming
  async warmCache(householdId: string) {
    const warmupQueries = [
      this.cacheLeaderboard(householdId),
      this.cacheMemberStats(householdId),
      this.cacheCurrentCaptain(householdId),
      this.cacheRecentTasks(householdId),
    ];

    await Promise.all(warmupQueries);
  }

  // Invalidation patterns
  async invalidateTaskCache(householdId: string) {
    const patterns = [
      `tasks:${householdId}:*`,
      `stats:${householdId}:*`,
      `leaderboard:${householdId}`,
    ];

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      // Also clear from memory cache
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(pattern.replace('*', ''))) {
          this.memoryCache.delete(key);
        }
      }
    }
  }
}

// Cache decorators
export function Cacheable(ttl: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      // Check cache
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache result
      await cacheManager.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// Usage example
class TaskService {
  @Cacheable(600) // Cache for 10 minutes
  async getTasks(householdId: string) {
    return await db.query('SELECT * FROM tasks WHERE household_id = $1', [householdId]);
  }
}
```

## Offline Support

### Offline-First Architecture

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Queue } from 'queue-typescript';

export class OfflineManager {
  private actionQueue: Queue<OfflineAction> = new Queue();
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  constructor() {
    this.setupNetworkListener();
    this.loadQueueFromStorage();
  }

  // Monitor network status
  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;

      if (wasOffline && this.isOnline) {
        // Back online - sync queued actions
        this.syncQueue();
      }
    });
  }

  // Queue action when offline
  async queueAction(action: OfflineAction) {
    // Add to queue
    this.actionQueue.enqueue({
      ...action,
      id: generateId(),
      timestamp: Date.now(),
      retries: 0,
    });

    // Persist to storage
    await this.saveQueueToStorage();

    // Try to sync if online
    if (this.isOnline) {
      this.syncQueue();
    }
  }

  // Sync queued actions
  async syncQueue() {
    if (this.syncInProgress || this.actionQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    while (this.actionQueue.length > 0) {
      const action = this.actionQueue.dequeue();

      try {
        await this.executeAction(action);

        // Update UI optimistically
        this.notifySuccess(action);
      } catch (error) {
        action.retries++;

        if (action.retries < 3) {
          // Retry later
          this.actionQueue.enqueue(action);
        } else {
          // Max retries reached
          this.notifyFailure(action, error);
        }
      }
    }

    // Save updated queue
    await this.saveQueueToStorage();
    this.syncInProgress = false;
  }

  // Execute action
  private async executeAction(action: OfflineAction) {
    switch (action.type) {
      case 'CREATE_TASK':
        return await api.createTask(action.payload);

      case 'COMPLETE_TASK':
        return await api.completeTask(action.payload);

      case 'SEND_MESSAGE':
        return await api.sendMessage(action.payload);

      case 'RATE_CAPTAIN':
        return await api.rateCaptain(action.payload);

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Persist queue to storage
  private async saveQueueToStorage() {
    const queueArray = this.actionQueue.toArray();
    await AsyncStorage.setItem(
      'offline_queue',
      JSON.stringify(queueArray)
    );
  }

  // Load queue from storage
  private async loadQueueFromStorage() {
    const stored = await AsyncStorage.getItem('offline_queue');
    if (stored) {
      const actions = JSON.parse(stored);
      actions.forEach(action => this.actionQueue.enqueue(action));
    }
  }
}

// Offline-capable store
export class OfflineStore {
  // Get data with fallback to cache
  async getData(key: string, fetcher: () => Promise<any>) {
    try {
      // Try to fetch fresh data
      const data = await fetcher();

      // Cache for offline use
      await AsyncStorage.setItem(`cache:${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));

      return { data, source: 'network' };
    } catch (error) {
      // Fallback to cached data
      const cached = await AsyncStorage.getItem(`cache:${key}`);

      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        return {
          data,
          source: 'cache',
          age,
          stale: age > 3600000, // Data older than 1 hour is stale
        };
      }

      throw new Error('No data available offline');
    }
  }

  // Sync local changes
  async syncLocalChanges() {
    const changes = await this.getLocalChanges();

    for (const change of changes) {
      try {
        await this.syncChange(change);
        await this.markChangeSynced(change.id);
      } catch (error) {
        console.error('Sync failed for change:', change.id, error);
      }
    }
  }
}
```

## Monitoring & Alerting

### Performance Monitoring Setup

```typescript
import { init as initSentry } from '@sentry/react-native';
import analytics from '@segment/analytics-react-native';

// Sentry configuration for performance monitoring
initSentry({
  dsn: process.env.SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 0.1,              // Sample 10% of transactions

  // Custom sampling
  tracesSampler: samplingContext => {
    // Always sample critical flows
    if (samplingContext.transactionContext.name === 'task-completion') {
      return 1.0;
    }

    // Sample 50% of premium users
    if (samplingContext.transactionContext.tags?.premium === true) {
      return 0.5;
    }

    // Default sampling
    return 0.1;
  },

  // Performance metrics
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation,
      tracingOrigins: ['localhost', 'api.homie.app', /^\//],

      // Trace idle transactions
      idleTimeout: 3000,

      // Track slow and frozen frames
      enableAppStartTracking: true,
      enableNativeFramesTracking: true,
    }),
  ],

  // Capture additional context
  beforeSend: (event, hint) => {
    // Add custom context
    event.contexts = {
      ...event.contexts,
      app: {
        memory_usage: getMemoryUsage(),
        battery_level: getBatteryLevel(),
        network_type: getNetworkType(),
      },
    };

    return event;
  },
});

// Custom performance tracking
export class PerformanceTracker {
  static trackScreenLoad(screenName: string) {
    const transaction = Sentry.startTransaction({
      name: screenName,
      op: 'navigation',
    });

    Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));

    return {
      finish: () => transaction.finish(),
      setData: (key: string, value: any) => transaction.setData(key, value),
    };
  }

  static trackAPICall(endpoint: string) {
    const span = Sentry.getCurrentHub()
      .getScope()
      ?.getSpan()
      ?.startChild({
        op: 'http',
        description: endpoint,
      });

    return {
      finish: (status: number) => {
        span?.setStatus(status < 400 ? 'ok' : 'internal_error');
        span?.finish();
      },
    };
  }

  static trackDatabaseQuery(query: string) {
    const span = Sentry.getCurrentHub()
      .getScope()
      ?.getSpan()
      ?.startChild({
        op: 'db',
        description: query,
      });

    return {
      finish: () => span?.finish(),
    };
  }
}
```

### Alert Thresholds

```typescript
export const AlertThresholds = {
  // Performance alerts
  performance: {
    coldStart: {
      warning: 2500,  // Warning at 2.5s
      critical: 3000, // Critical at 3s
    },
    apiLatency: {
      p95Warning: 500,  // Warning if p95 > 500ms
      p95Critical: 1000, // Critical if p95 > 1s
    },
    crashRate: {
      warning: 0.01,   // Warning at 1% crash rate
      critical: 0.02,  // Critical at 2% crash rate
    },
    memoryUsage: {
      warning: 200,    // Warning at 200MB
      critical: 300,   // Critical at 300MB
    },
  },

  // Business metrics alerts
  business: {
    taskCompletionRate: {
      warning: 0.7,    // Warning if <70% tasks completed
      critical: 0.5,   // Critical if <50% tasks completed
    },
    userEngagement: {
      warning: 0.3,    // Warning if DAU/MAU <30%
      critical: 0.2,   // Critical if DAU/MAU <20%
    },
  },
};

// Alert manager
export class AlertManager {
  static async checkThresholds(metrics: Metrics) {
    const alerts = [];

    // Check performance thresholds
    if (metrics.coldStart > AlertThresholds.performance.coldStart.critical) {
      alerts.push({
        severity: 'critical',
        metric: 'coldStart',
        value: metrics.coldStart,
        threshold: AlertThresholds.performance.coldStart.critical,
      });
    }

    // Check crash rate
    if (metrics.crashRate > AlertThresholds.performance.crashRate.critical) {
      alerts.push({
        severity: 'critical',
        metric: 'crashRate',
        value: metrics.crashRate,
        threshold: AlertThresholds.performance.crashRate.critical,
      });
    }

    // Send alerts
    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
  }

  static async sendAlerts(alerts: Alert[]) {
    // Send to monitoring service
    await Promise.all([
      this.sendToSlack(alerts),
      this.sendToPagerDuty(alerts.filter(a => a.severity === 'critical')),
      this.logToDatadog(alerts),
    ]);
  }
}
```

## Performance Testing

### Load Testing Script

```javascript
// k6 load test for API performance
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% requests under 500ms
    errors: ['rate<0.01'],              // Error rate under 1%
  },
};

export default function () {
  const BASE_URL = 'https://api.homie.app';

  // Simulate user flow
  const responses = {
    // 1. Login
    login: http.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password',
    }),

    // 2. Get tasks
    tasks: http.get(`${BASE_URL}/tasks`),

    // 3. Complete task
    complete: http.post(`${BASE_URL}/tasks/1/complete`),

    // 4. Get leaderboard
    leaderboard: http.get(`${BASE_URL}/leaderboard`),
  };

  // Check responses
  for (const [name, response] of Object.entries(responses)) {
    check(response, {
      [`${name} status 200`]: r => r.status === 200,
      [`${name} response time < 500ms`]: r => r.timings.duration < 500,
    });

    errorRate.add(response.status !== 200);
  }

  sleep(1);
}
```

## Performance Optimization Checklist

### Pre-Launch Checklist

- [ ] Bundle size under 3MB
- [ ] Cold start under 2 seconds
- [ ] All images optimized and using CDN
- [ ] Code splitting implemented
- [ ] Memory leaks tested and fixed
- [ ] Database queries optimized (<50ms)
- [ ] Caching strategy implemented
- [ ] Offline support tested
- [ ] Load testing completed (200+ concurrent users)
- [ ] Performance monitoring configured

### Post-Launch Monitoring

- [ ] Daily performance reports
- [ ] Weekly performance reviews
- [ ] Monthly optimization sprints
- [ ] Quarterly architecture reviews
- [ ] User feedback on performance
- [ ] Competitive benchmarking

## Conclusion

Maintaining high performance requires continuous monitoring, optimization, and testing. These standards ensure Homie delivers a fast, responsive experience that scales to thousands of users while maintaining sub-second response times and smooth animations.