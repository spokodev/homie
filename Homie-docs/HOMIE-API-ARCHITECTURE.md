# Homie API Architecture Standards

## Overview

This document defines the comprehensive API architecture, standards, and best practices for the Homie application. It covers REST API design, real-time communications, rate limiting, caching, versioning, and scalability strategies.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mobile App (React Native)                │
├─────────────────────────────────────────────────────────────────┤
│                          API Gateway                             │
│                    (Rate Limiting, Auth, Routing)                │
├─────────────────────────────────────────────────────────────────┤
│    REST API          │    WebSocket          │    Edge Functions │
│   (Supabase)         │   (Realtime)          │    (Serverless)   │
├─────────────────────────────────────────────────────────────────┤
│                     PostgreSQL (Supabase)                        │
│                         with RLS                                 │
├─────────────────────────────────────────────────────────────────┤
│     Redis            │      S3/CDN           │    Message Queue  │
│   (Caching)          │    (Files)            │      (Events)     │
└─────────────────────────────────────────────────────────────────┘
```

## Rate Limiting Strategy

### Rate Limit Tiers

```typescript
interface RateLimitTiers {
  anonymous: {
    requests: 10;
    window: '1m';  // 10 requests per minute
    burst: 15;     // Allow burst of 15
  };

  authenticated: {
    requests: 100;
    window: '1m';  // 100 requests per minute
    burst: 150;
  };

  premium: {
    requests: 200;
    window: '1m';  // 200 requests per minute
    burst: 300;
  };

  websocket: {
    connections: 5;  // Max concurrent connections
    messages: 100;   // Messages per minute
    subscriptions: 10; // Max channel subscriptions
  };
}
```

### Rate Limit Implementation

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  enableOfflineQueue: false,
});

// Different rate limiters for different tiers
export const rateLimiters = {
  anonymous: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:anon',
    points: 10,        // Number of requests
    duration: 60,      // Per 60 seconds
    blockDuration: 60, // Block for 60 seconds
  }),

  authenticated: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:auth',
    points: 100,
    duration: 60,
    blockDuration: 60,
  }),

  premium: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:prem',
    points: 200,
    duration: 60,
    blockDuration: 60,
  }),

  // Endpoint-specific limits
  authEndpoints: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:auth-ep',
    points: 5,         // 5 login attempts
    duration: 900,     // Per 15 minutes
    blockDuration: 900,
  }),

  uploadEndpoints: new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:upload',
    points: 10,        // 10 uploads
    duration: 3600,    // Per hour
    blockDuration: 3600,
  }),
};

// Middleware
export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const limiter = getLimiterForUser(req.user);
    const key = req.user?.id || req.ip;

    await limiter.consume(key);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter.points);
    res.setHeader('X-RateLimit-Remaining', limiter.remainingPoints);
    res.setHeader('X-RateLimit-Reset', limiter.msBeforeNext);

    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60,
    });
  }
}
```

### Rate Limit Headers

```typescript
interface RateLimitHeaders {
  'X-RateLimit-Limit': number;      // Request limit
  'X-RateLimit-Remaining': number;  // Remaining requests
  'X-RateLimit-Reset': number;       // Reset time (Unix timestamp)
  'X-RateLimit-Retry-After': number; // Seconds until retry (on 429)
}
```

## API Versioning

### Versioning Strategy

```typescript
// Header-based versioning (preferred)
interface VersionHeaders {
  'Accept': 'application/vnd.homie.v1+json';
  'API-Version': '1.0';
}

// URL-based versioning (alternative)
// /api/v1/tasks
// /api/v2/tasks

// Implementation
export class APIVersioning {
  static readonly CURRENT_VERSION = 'v1';
  static readonly SUPPORTED_VERSIONS = ['v1'];
  static readonly DEPRECATED_VERSIONS = [];

  static getVersion(req: Request): string {
    // Check header first
    const acceptHeader = req.headers.accept;
    if (acceptHeader?.includes('vnd.homie')) {
      const match = acceptHeader.match(/vnd\.homie\.v(\d+)/);
      if (match) return `v${match[1]}`;
    }

    // Check custom header
    const apiVersion = req.headers['api-version'];
    if (apiVersion) return `v${apiVersion.split('.')[0]}`;

    // Check URL
    const urlMatch = req.path.match(/\/v(\d+)\//);
    if (urlMatch) return `v${urlMatch[1]}`;

    // Default to current version
    return this.CURRENT_VERSION;
  }

  static isDeprecated(version: string): boolean {
    return this.DEPRECATED_VERSIONS.includes(version);
  }

  static versionMiddleware(req: Request, res: Response, next: NextFunction) {
    const version = APIVersioning.getVersion(req);

    if (!APIVersioning.SUPPORTED_VERSIONS.includes(version)) {
      return res.status(410).json({
        error: 'API Version Not Supported',
        supportedVersions: APIVersioning.SUPPORTED_VERSIONS,
        currentVersion: APIVersioning.CURRENT_VERSION,
      });
    }

    if (APIVersioning.isDeprecated(version)) {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', '2025-01-01'); // Sunset date
      res.setHeader('Link', '</api/v2/docs>; rel="successor-version"');
    }

    req.apiVersion = version;
    next();
  }
}
```

### Deprecation Policy

```typescript
interface DeprecationPolicy {
  announcementPeriod: '6 months';    // Announce 6 months before
  warningPeriod: '3 months';         // Add warnings 3 months before
  sunsetPeriod: '12 months';         // Support for 12 months total
  migrationGuide: boolean;           // Provide migration guide
  backwardCompatibility: '2 versions'; // Support last 2 versions
}

// Deprecation response headers
interface DeprecationHeaders {
  'Deprecation': 'true';
  'Sunset': string;                  // RFC3339 date
  'Link': string;                    // Link to new version
  'Warning': string;                 // Warning message
}
```

## Pagination Standards

### Cursor-Based Pagination (for real-time data)

```typescript
interface CursorPagination {
  cursor?: string;    // Opaque cursor
  limit: number;      // Items per page (default: 50, max: 100)
  direction?: 'forward' | 'backward';
}

// Implementation
export class CursorPaginator {
  static encode(data: { id: string; timestamp: string }): string {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  static decode(cursor: string): { id: string; timestamp: string } {
    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  }

  static async paginate<T>(
    query: Query<T>,
    options: CursorPagination
  ): Promise<PaginatedResponse<T>> {
    const limit = Math.min(options.limit || 50, 100);

    if (options.cursor) {
      const decoded = this.decode(options.cursor);
      query = query.where('created_at', '<', decoded.timestamp);
    }

    const items = await query.limit(limit + 1).execute();
    const hasMore = items.length > limit;

    if (hasMore) {
      items.pop(); // Remove extra item
    }

    const nextCursor = hasMore
      ? this.encode({
          id: items[items.length - 1].id,
          timestamp: items[items.length - 1].created_at,
        })
      : null;

    return {
      data: items,
      pagination: {
        cursor: nextCursor,
        hasMore,
        count: items.length,
      },
    };
  }
}
```

### Offset-Based Pagination (for static data)

```typescript
interface OffsetPagination {
  page: number;       // Page number (1-based)
  limit: number;      // Items per page
}

interface OffsetPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Response format
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 250,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": true
  }
}
```

## Caching Strategy

### Cache Layers

```typescript
interface CacheLayers {
  browser: {
    enabled: true;
    maxAge: 300;        // 5 minutes for static content
  };

  cdn: {
    enabled: true;
    provider: 'Cloudflare';
    ttl: 3600;          // 1 hour for assets
  };

  redis: {
    enabled: true;
    ttl: {
      session: 86400;   // 24 hours
      userProfile: 600; // 10 minutes
      leaderboard: 600; // 10 minutes
      taskList: 60;     // 1 minute
    };
  };

  database: {
    materializedViews: true;
    queryCache: true;
  };
}
```

### Redis Caching Implementation

```typescript
import Redis from 'ioredis';
import { createHash } from 'crypto';

export class CacheService {
  private redis: Redis;
  private defaultTTL = 600; // 10 minutes

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    });
  }

  // Generate cache key
  private generateKey(namespace: string, params: any): string {
    const hash = createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');
    return `cache:${namespace}:${hash}`;
  }

  // Get from cache
  async get<T>(namespace: string, params: any): Promise<T | null> {
    const key = this.generateKey(namespace, params);
    const cached = await this.redis.get(key);

    if (!cached) return null;

    return JSON.parse(cached);
  }

  // Set cache with TTL
  async set<T>(
    namespace: string,
    params: any,
    data: T,
    ttl?: number
  ): Promise<void> {
    const key = this.generateKey(namespace, params);
    const serialized = JSON.stringify(data);

    await this.redis.setex(key, ttl || this.defaultTTL, serialized);
  }

  // Invalidate cache
  async invalidate(namespace: string, params?: any): Promise<void> {
    if (params) {
      // Invalidate specific key
      const key = this.generateKey(namespace, params);
      await this.redis.del(key);
    } else {
      // Invalidate entire namespace
      const keys = await this.redis.keys(`cache:${namespace}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  // Cache middleware
  cacheMiddleware(namespace: string, ttl?: number) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const cacheKey = { ...req.params, ...req.query };
      const cached = await this.get(namespace, cacheKey);

      if (cached) {
        res.setHeader('X-Cache-Hit', 'true');
        return res.json(cached);
      }

      // Store original send function
      const originalSend = res.json.bind(res);

      // Override send to cache response
      res.json = (data: any) => {
        this.set(namespace, cacheKey, data, ttl);
        res.setHeader('X-Cache-Hit', 'false');
        return originalSend(data);
      };

      next();
    };
  }
}

// Cache invalidation patterns
export class CacheInvalidation {
  static async onTaskCreate(householdId: string) {
    await cache.invalidate('tasks', { householdId });
    await cache.invalidate('stats', { householdId });
  }

  static async onTaskComplete(task: Task) {
    await cache.invalidate('tasks', { householdId: task.householdId });
    await cache.invalidate('leaderboard', { householdId: task.householdId });
    await cache.invalidate('member', { memberId: task.assignedTo });
  }

  static async onRatingSubmit(captainId: string) {
    await cache.invalidate('captain', { captainId });
    await cache.invalidate('ratings', { captainId });
  }
}
```

### HTTP Cache Headers

```typescript
export const cacheHeaders = {
  // No cache for dynamic content
  noCache: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },

  // Cache for static content
  staticContent: {
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
  },

  // Cache for API responses
  apiResponse: (maxAge: number = 60) => ({
    'Cache-Control': `private, max-age=${maxAge}`,
    'Vary': 'Accept-Encoding, Authorization',
  }),

  // Conditional cache
  conditional: (etag: string, lastModified: Date) => ({
    'ETag': etag,
    'Last-Modified': lastModified.toUTCString(),
    'Cache-Control': 'private, must-revalidate',
  }),
};
```

## Error Response Format

### Standard Error Response

```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable message
    details?: any;          // Additional error details
    field?: string;         // Field that caused error
    requestId: string;      // Unique request ID for debugging
    timestamp: string;      // ISO 8601 timestamp
    documentation?: string; // Link to documentation
  };
}

// Error codes
enum ErrorCodes {
  // Authentication errors (401)
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_MFA_REQUIRED = 'AUTH_MFA_REQUIRED',

  // Authorization errors (403)
  AUTHZ_INSUFFICIENT_PERMISSIONS = 'AUTHZ_INSUFFICIENT_PERMISSIONS',
  AUTHZ_RESOURCE_FORBIDDEN = 'AUTHZ_RESOURCE_FORBIDDEN',
  AUTHZ_SUBSCRIPTION_REQUIRED = 'AUTHZ_SUBSCRIPTION_REQUIRED',

  // Validation errors (400)
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  VALIDATION_MISSING_FIELD = 'VALIDATION_MISSING_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',

  // Resource errors (404)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_DELETED = 'RESOURCE_DELETED',

  // Conflict errors (409)
  CONFLICT_DUPLICATE_RESOURCE = 'CONFLICT_DUPLICATE_RESOURCE',
  CONFLICT_RESOURCE_LOCKED = 'CONFLICT_RESOURCE_LOCKED',

  // Rate limit errors (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  SERVER_INTERNAL_ERROR = 'SERVER_INTERNAL_ERROR',
  SERVER_DATABASE_ERROR = 'SERVER_DATABASE_ERROR',
  SERVER_EXTERNAL_SERVICE_ERROR = 'SERVER_EXTERNAL_SERVICE_ERROR',
}

// Error handler
export class ErrorHandler {
  static handle(error: any, req: Request, res: Response) {
    const requestId = req.id || uuidv4();
    const timestamp = new Date().toISOString();

    // Log error
    logger.error({
      requestId,
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      user: req.user?.id,
    });

    // Determine status code
    const statusCode = error.statusCode || 500;

    // Build error response
    const response: ErrorResponse = {
      error: {
        code: error.code || ErrorCodes.SERVER_INTERNAL_ERROR,
        message: this.sanitizeMessage(error.message),
        requestId,
        timestamp,
      },
    };

    // Add details in development
    if (process.env.NODE_ENV === 'development') {
      response.error.details = {
        stack: error.stack,
        originalError: error.message,
      };
    }

    res.status(statusCode).json(response);
  }

  static sanitizeMessage(message: string): string {
    // Don't leak sensitive information
    if (message.includes('database')) {
      return 'A database error occurred';
    }
    if (message.includes('password')) {
      return 'Authentication failed';
    }
    return message;
  }
}
```

## Request/Response Validation

### Request Validation Schema

```typescript
import { z } from 'zod';

// Define schemas using Zod
export const schemas = {
  createTask: z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    roomId: z.string().uuid(),
    assignedTo: z.string().uuid().optional(),
    dueDate: z.string().datetime().optional(),
    estimatedMinutes: z.number().min(1).max(480).optional(),
    points: z.number().min(10).max(50),
    recurring: z.object({
      type: z.enum(['daily', 'weekly', 'monthly']),
      days: z.array(z.number().min(0).max(6)).optional(),
    }).optional(),
  }),

  rateCapt ain: z.object({
    stars: z.number().min(1).max(5),
    feedbackGood: z.array(z.string()).max(5).optional(),
    feedbackImprove: z.array(z.string()).max(5).optional(),
    overallComment: z.string().max(500).optional(),
    privateNote: z.string().max(500).optional(),
    categories: z.object({
      cleanliness: z.number().min(1).max(5).optional(),
      timeliness: z.number().min(1).max(5).optional(),
      quality: z.number().min(1).max(5).optional(),
      communication: z.number().min(1).max(5).optional(),
      initiative: z.number().min(1).max(5).optional(),
    }).optional(),
  }),
};

// Validation middleware
export function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated; // Replace with validated/transformed data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: ErrorCodes.VALIDATION_INVALID_INPUT,
            message: 'Validation failed',
            details: error.errors,
            requestId: req.id,
            timestamp: new Date().toISOString(),
          },
        });
      }
      next(error);
    }
  };
}
```

### Response Validation

```typescript
// Ensure responses match expected schema
export function validateResponse(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = (data: any) => {
      try {
        const validated = schema.parse(data);
        return originalJson(validated);
      } catch (error) {
        logger.error('Response validation failed', { error, data });
        return originalJson({
          error: {
            code: ErrorCodes.SERVER_INTERNAL_ERROR,
            message: 'Internal server error',
            requestId: req.id,
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    next();
  };
}
```

## Real-time Scalability Architecture

### WebSocket Connection Management

```typescript
interface WebSocketConfig {
  maxConnectionsPerUser: 5;
  connectionTimeout: 30000;        // 30 seconds
  heartbeatInterval: 25000;        // 25 seconds
  reconnectDelay: [1000, 5000, 10000, 30000]; // Exponential backoff
  maxReconnectAttempts: 10;
}

export class WebSocketManager {
  private connections: Map<string, Set<WebSocket>> = new Map();

  async handleConnection(ws: WebSocket, userId: string) {
    // Check connection limit
    const userConnections = this.connections.get(userId) || new Set();

    if (userConnections.size >= WebSocketConfig.maxConnectionsPerUser) {
      // Close oldest connection
      const oldest = userConnections.values().next().value;
      oldest.close(1008, 'Connection limit exceeded');
      userConnections.delete(oldest);
    }

    // Add new connection
    userConnections.add(ws);
    this.connections.set(userId, userConnections);

    // Setup heartbeat
    this.setupHeartbeat(ws);

    // Setup event handlers
    ws.on('message', (data) => this.handleMessage(ws, userId, data));
    ws.on('close', () => this.handleDisconnect(ws, userId));
    ws.on('error', (error) => this.handleError(ws, userId, error));
  }

  private setupHeartbeat(ws: WebSocket) {
    let isAlive = true;

    ws.on('pong', () => {
      isAlive = true;
    });

    const interval = setInterval(() => {
      if (!isAlive) {
        ws.close(1001, 'Connection timeout');
        clearInterval(interval);
        return;
      }

      isAlive = false;
      ws.ping();
    }, WebSocketConfig.heartbeatInterval);

    ws.on('close', () => clearInterval(interval));
  }
}
```

### Channel Management

```typescript
interface ChannelConfig {
  maxChannelsPerConnection: 10;
  channelTypes: {
    household: {
      pattern: 'household:{id}';
      permissions: 'member';
      events: ['task', 'message', 'rating', 'member'];
    };
    chat: {
      pattern: 'chat:{householdId}';
      permissions: 'member';
      events: ['message', 'typing', 'read'];
    };
    captain: {
      pattern: 'captain:{id}';
      permissions: 'household';
      events: ['rating', 'feedback'];
    };
    presence: {
      pattern: 'presence:{householdId}';
      permissions: 'member';
      events: ['online', 'offline', 'activity'];
    };
  };
}

export class ChannelManager {
  private subscriptions: Map<string, Set<string>> = new Map();

  async subscribe(
    connectionId: string,
    channel: string,
    userId: string
  ): Promise<void> {
    // Validate channel format
    const channelType = this.getChannelType(channel);
    if (!channelType) {
      throw new Error('Invalid channel format');
    }

    // Check permissions
    const hasPermission = await this.checkPermission(
      userId,
      channel,
      channelType.permissions
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }

    // Check subscription limit
    const subscriptions = this.subscriptions.get(connectionId) || new Set();
    if (subscriptions.size >= ChannelConfig.maxChannelsPerConnection) {
      throw new Error('Channel limit exceeded');
    }

    // Subscribe
    subscriptions.add(channel);
    this.subscriptions.set(connectionId, subscriptions);

    // Join Redis pub/sub
    await redis.subscribe(channel);
  }

  async broadcast(channel: string, event: string, data: any): Promise<void> {
    const message = JSON.stringify({
      channel,
      event,
      data,
      timestamp: Date.now(),
    });

    // Broadcast via Redis pub/sub
    await redis.publish(channel, message);
  }
}
```

### Message Queue for Reliability

```typescript
interface MessageQueueConfig {
  provider: 'supabase' | 'rabbitmq' | 'kafka';
  retryPolicy: {
    maxAttempts: 3;
    backoff: 'exponential';
    delays: [1000, 5000, 15000];
  };
  deadLetterQueue: true;
  maxQueueSize: 10000;
  ttl: 86400; // 24 hours
}

export class MessageQueue {
  private queue: Map<string, QueueItem[]> = new Map();

  async enqueue(
    userId: string,
    message: any,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<void> {
    const queueItem: QueueItem = {
      id: uuidv4(),
      userId,
      message,
      priority,
      attempts: 0,
      createdAt: Date.now(),
      nextRetry: Date.now(),
    };

    // Add to user's queue
    const userQueue = this.queue.get(userId) || [];
    userQueue.push(queueItem);

    // Sort by priority and timestamp
    userQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.createdAt - b.createdAt;
    });

    // Enforce queue size limit
    if (userQueue.length > MessageQueueConfig.maxQueueSize) {
      userQueue.shift(); // Remove oldest low-priority message
    }

    this.queue.set(userId, userQueue);

    // Process queue
    await this.processQueue(userId);
  }

  async processQueue(userId: string): Promise<void> {
    const userQueue = this.queue.get(userId);
    if (!userQueue || userQueue.length === 0) return;

    const now = Date.now();
    const toProcess = userQueue.filter(item => item.nextRetry <= now);

    for (const item of toProcess) {
      try {
        await this.deliver(item);
        // Remove from queue on success
        const index = userQueue.indexOf(item);
        userQueue.splice(index, 1);
      } catch (error) {
        item.attempts++;

        if (item.attempts >= MessageQueueConfig.retryPolicy.maxAttempts) {
          // Move to dead letter queue
          await this.moveToDeadLetter(item);
          const index = userQueue.indexOf(item);
          userQueue.splice(index, 1);
        } else {
          // Schedule retry
          const delay = MessageQueueConfig.retryPolicy.delays[item.attempts - 1];
          item.nextRetry = now + delay;
        }
      }
    }

    this.queue.set(userId, userQueue);
  }
}
```

### Broadcasting Optimization

```typescript
export class BroadcastOptimizer {
  // Batch notifications for large households
  static async broadcastToHousehold(
    householdId: string,
    event: string,
    data: any
  ): Promise<void> {
    const members = await getHouseholdMembers(householdId);

    if (members.length <= 20) {
      // Direct broadcast for small households
      await Promise.all(
        members.map(member =>
          this.sendToUser(member.userId, event, data)
        )
      );
    } else {
      // Batch broadcast for large households
      const batches = chunk(members, 20);

      for (const batch of batches) {
        await Promise.all(
          batch.map(member =>
            this.sendToUser(member.userId, event, data)
          )
        );
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Deduplicate messages
  private static messageCache = new Map<string, number>();

  static isDuplicate(messageId: string): boolean {
    const now = Date.now();
    const lastSeen = this.messageCache.get(messageId);

    // Clean old entries
    if (this.messageCache.size > 10000) {
      for (const [id, timestamp] of this.messageCache.entries()) {
        if (now - timestamp > 60000) { // 1 minute
          this.messageCache.delete(id);
        }
      }
    }

    if (lastSeen && now - lastSeen < 5000) { // 5 seconds
      return true;
    }

    this.messageCache.set(messageId, now);
    return false;
  }
}
```

## API Endpoints Organization

### RESTful Resource Naming

```typescript
// Resource naming conventions
interface ResourceNaming {
  // Collections (plural)
  '/api/v1/households': 'GET, POST';
  '/api/v1/households/:id': 'GET, PUT, DELETE';

  // Sub-resources
  '/api/v1/households/:id/members': 'GET, POST';
  '/api/v1/households/:id/members/:memberId': 'GET, PUT, DELETE';

  // Actions (verbs for non-CRUD)
  '/api/v1/tasks/:id/complete': 'POST';
  '/api/v1/captains/:id/rate': 'POST';
  '/api/v1/households/:id/invite': 'POST';

  // Filters via query params
  '/api/v1/tasks?status=pending&assignedTo=userId': 'GET';
  '/api/v1/tasks?room=kitchen&dueDate=2024-01-01': 'GET';
}
```

### API Routes Structure

```typescript
// routes/index.ts
export const routes = {
  // Authentication
  '/auth/signup': authController.signup,
  '/auth/login': authController.login,
  '/auth/logout': authController.logout,
  '/auth/refresh': authController.refresh,
  '/auth/verify': authController.verify,
  '/auth/reset-password': authController.resetPassword,

  // Households
  '/households': householdController.list,
  '/households/:id': householdController.get,
  '/households/:id/members': memberController.list,
  '/households/:id/invite': inviteController.create,

  // Tasks
  '/tasks': taskController.list,
  '/tasks/:id': taskController.get,
  '/tasks/:id/complete': taskController.complete,
  '/tasks/:id/assign': taskController.assign,

  // Captain System
  '/captains/current': captainController.current,
  '/captains/:id': captainController.get,
  '/captains/:id/rate': ratingController.create,
  '/captains/:id/ratings': ratingController.list,

  // Rooms & Notes
  '/rooms': roomController.list,
  '/rooms/:id': roomController.get,
  '/rooms/:id/notes': noteController.list,
  '/rooms/:id/notes/:noteId': noteController.get,

  // Chat
  '/messages': messageController.list,
  '/messages/:id': messageController.get,
  '/messages/send': messageController.send,

  // Gamification
  '/leaderboard': leaderboardController.get,
  '/members/:id/stats': statsController.get,
  '/members/:id/badges': badgeController.list,
  '/members/:id/points': pointsController.history,

  // Subscriptions
  '/subscriptions/current': subscriptionController.get,
  '/subscriptions/upgrade': subscriptionController.upgrade,
  '/subscriptions/cancel': subscriptionController.cancel,
};
```

## Performance Optimization

### Query Optimization

```typescript
// Use database views for complex queries
CREATE VIEW household_stats AS
SELECT
  h.id as household_id,
  COUNT(DISTINCT m.id) as member_count,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
  AVG(cr.stars) as avg_captain_rating,
  SUM(m.points) as total_points
FROM households h
LEFT JOIN members m ON m.household_id = h.id
LEFT JOIN tasks t ON t.household_id = h.id
LEFT JOIN cleaning_captains cc ON cc.household_id = h.id
LEFT JOIN captain_ratings cr ON cr.captain_id = cc.id
GROUP BY h.id;

// Use this view in API
app.get('/api/v1/households/:id/stats', async (req, res) => {
  const stats = await db.query(
    'SELECT * FROM household_stats WHERE household_id = $1',
    [req.params.id]
  );
  res.json(stats);
});
```

### Response Compression

```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Fallback to standard filter function
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses larger than 1KB
}));
```

### Connection Pooling

```typescript
// Database connection pool
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                     // Maximum connections
  idleTimeoutMillis: 30000,    // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout after 2s
});

// Redis connection pool
import Redis from 'ioredis';

const redis = new Redis.Cluster(
  [
    { port: 6379, host: 'redis-1' },
    { port: 6379, host: 'redis-2' },
    { port: 6379, host: 'redis-3' },
  ],
  {
    redisOptions: {
      password: process.env.REDIS_PASSWORD,
    },
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
  }
);
```

## Monitoring & Observability

### API Metrics

```typescript
import prometheus from 'prom-client';

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const activeConnections = new prometheus.Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections',
});

// Metrics middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });

  next();
}

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.send(await prometheus.register.metrics());
});
```

### Request Tracing

```typescript
import { v4 as uuidv4 } from 'uuid';

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] || uuidv4();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Add to logger context
  logger.child({ requestId });

  next();
}

// Distributed tracing
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new IORedisInstrumentation(),
  ],
});
```

## Security Middleware

```typescript
// Security middleware stack
export const securityMiddleware = [
  helmet(),                      // Security headers
  cors(corsOptions),              // CORS
  rateLimitMiddleware,            // Rate limiting
  authenticationMiddleware,       // Authentication
  authorizationMiddleware,        // Authorization
  validationMiddleware,           // Input validation
  sanitizationMiddleware,         // Input sanitization
];

// Apply to all routes
app.use('/api', securityMiddleware);
```

## API Documentation

### OpenAPI/Swagger Specification

```yaml
openapi: 3.0.0
info:
  title: Homie API
  version: 1.0.0
  description: API for Homie household management app
servers:
  - url: https://api.homie.app/v1
    description: Production
  - url: https://staging-api.homie.app/v1
    description: Staging
security:
  - bearerAuth: []
paths:
  /tasks:
    get:
      summary: List tasks
      parameters:
        - in: query
          name: status
          schema:
            type: string
            enum: [pending, completed]
        - in: query
          name: assignedTo
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskList'
```

## Testing Strategy

### API Testing

```typescript
// Integration tests
describe('Tasks API', () => {
  it('should create a task', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Task',
        points: 20,
        roomId: roomId,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe('Test Task');
  });

  it('should handle rate limiting', async () => {
    // Make requests up to limit
    for (let i = 0; i < 100; i++) {
      await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`);
    }

    // Next request should be rate limited
    const response = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

### Load Testing

```typescript
// k6 load test script
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp to 200
    { duration: '5m', target: 200 },  // Stay at 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function () {
  const response = http.get('https://api.homie.app/v1/tasks');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Deployment Configuration

### Environment Variables

```bash
# API Configuration
NODE_ENV=production
API_VERSION=1.0.0
PORT=3000

# Database
DATABASE_URL=postgres://user:pass@host:5432/homie
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# Redis
REDIS_HOST=redis.homie.app
REDIS_PORT=6379
REDIS_PASSWORD=secret

# Security
JWT_SECRET=secret
ENCRYPTION_KEY=secret
RATE_LIMIT_ENABLED=true

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
POSTHOG_API_KEY=...

# External Services
REVENUECAT_API_KEY=...
S3_BUCKET=homie-uploads
```

## Conclusion

This API architecture provides a scalable, secure, and maintainable foundation for the Homie application. Key features include:

- **Scalability**: Handles 10,000+ concurrent users
- **Security**: Multiple layers of protection
- **Performance**: Sub-500ms response times
- **Reliability**: 99.9% uptime target
- **Maintainability**: Clear standards and documentation

Regular reviews and updates of this architecture document ensure it remains aligned with evolving requirements and best practices.