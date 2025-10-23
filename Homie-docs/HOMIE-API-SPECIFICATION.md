# HOMIE API Specification

## Authentication Endpoints

### POST /auth/signup
```json
Request:
{
  "email": "string",
  "password": "string",
  "name": "string"
}

Response:
{
  "user": {...},
  "session": {...}
}
```

### POST /auth/login
```json
Request:
{
  "email": "string",
  "password": "string"
}

Response:
{
  "user": {...},
  "session": {...}
}
```

## Household Endpoints

### POST /households
Create new household
```json
Request:
{
  "name": "string",
  "icon": "string"
}

Response:
{
  "id": "uuid",
  "name": "string",
  "icon": "string",
  "invite_code": "string"
}
```

### POST /households/join
Join existing household
```json
Request:
{
  "invite_code": "string"
}

Response:
{
  "household": {...},
  "member": {...}
}
```

### GET /households/:id
Get household details with members

### POST /households/:id/members
Add member to household
```json
Request:
{
  "name": "string",
  "type": "human" | "pet",
  "pet_type": "string?",
  "avatar": "string?"
}
```

## Tasks Endpoints

### GET /households/:id/tasks
Get all tasks with filters
```
Query params:
- status: pending | completed
- assigned_to: member_id
- room_id: uuid
- due_date: ISO date
```

### POST /tasks
Create new task
```json
Request:
{
  "household_id": "uuid",
  "room_id": "uuid",
  "title": "string",
  "description": "string?",
  "assigned_to": "uuid?",
  "due_date": "ISO date?",
  "estimated_minutes": "number?",
  "points": "number",
  "recurring_pattern": {}?
}
```

### PUT /tasks/:id/complete
Complete a task
```json
Request:
{
  "actual_minutes": "number",
  "satisfaction_rating": "1-5"
}

Response:
{
  "task": {...},
  "points_earned": "number",
  "bonuses": []
}
```

## Cleaning Captain Endpoints

### GET /households/:id/captains/current
Get current week's captain

### POST /households/:id/captains/schedule
Generate captain schedule
```json
Request:
{
  "weeks_ahead": "number",
  "excluded_dates": []
}
```

### GET /captains/:id/ratings
Get ratings for a captain

### POST /captains/:id/rate
Submit rating for captain
```json
Request:
{
  "stars": "1-5",
  "feedback_good": ["string"],
  "feedback_improve": ["string"],
  "overall_comment": "string?",
  "private_note": "string?",
  "categories": {
    "cleanliness": "1-5",
    "timeliness": "1-5",
    "quality": "1-5",
    "communication": "1-5",
    "initiative": "1-5"
  }
}
```

## Room Notes Endpoints

### GET /rooms/:id/notes
Get notes for a room

### POST /rooms/:id/notes
Create new note
```json
Request:
{
  "content": "string",
  "color": "yellow" | "blue" | "pink" | "green",
  "photo_url": "string?",
  "pinned": "boolean",
  "expires_at": "ISO date?"
}
```

## Chat Endpoints

### GET /households/:id/messages
Get messages with pagination
```
Query params:
- limit: number (default 50)
- before: ISO date
```

### POST /households/:id/messages
Send message
```json
Request:
{
  "content": "string",
  "type": "text" | "image" | "system",
  "metadata": {}?
}
```

## Gamification Endpoints

### GET /members/:id/stats
Get member statistics
```json
Response:
{
  "points": "number",
  "level": "number",
  "streak_days": "number",
  "tasks_completed": "number",
  "average_rating": "number",
  "badges": [],
  "rank": "number"
}
```

### GET /households/:id/leaderboard
Get current leaderboard
```json
Response:
{
  "week": {
    "members": [...],
    "pets": [...]
  },
  "all_time": {
    "members": [...],
    "pets": [...]
  }
}
```

## Real-time Subscriptions

### Supabase Realtime Channels

```javascript
// Subscribe to household changes
supabase.channel('household:id')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `household_id=eq.${householdId}`
  }, handleTaskChange)
  
// Subscribe to chat messages
supabase.channel('chat:household:id')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `household_id=eq.${householdId}`
  }, handleNewMessage)
  
// Subscribe to ratings
supabase.channel('ratings:captain:id')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'captain_ratings',
    filter: `captain_id=eq.${captainId}`
  }, handleNewRating)
```

## Real-time Scalability Architecture

### WebSocket Connection Management

#### Connection Limits
To prevent resource exhaustion and ensure fair usage, Homie implements connection limits:

- **Maximum 5 WebSocket connections per user**
- Connections are tracked by user authentication token
- When limit is reached, oldest idle connection is automatically closed
- Users receive warning notification before connection closure

#### Connection Priority Levels
```javascript
// Connection types in priority order (highest to lowest)
const CONNECTION_PRIORITIES = {
  HOUSEHOLD_UPDATES: 1,    // Tasks, members, rooms
  CHAT_MESSAGES: 2,        // Real-time chat
  LEADERBOARD: 3,          // Points and rankings
  NOTIFICATIONS: 4,        // General notifications
  PRESENCE: 5              // Online/offline status
};
```

#### Connection Monitoring Endpoint
```
GET /api/connections/status

Response:
{
  "active_connections": 3,
  "max_connections": 5,
  "connections": [
    {
      "id": "conn_123",
      "type": "household_updates",
      "priority": 1,
      "established_at": "2025-10-23T10:30:00Z",
      "last_activity": "2025-10-23T10:35:00Z"
    }
  ]
}
```

### Message Queue for Reliability

#### Queue Architecture
Homie uses a message queue system to ensure reliable delivery of real-time updates:

```javascript
// Message queue configuration
const QUEUE_CONFIG = {
  max_retry_attempts: 3,
  retry_delay_ms: [1000, 5000, 15000],  // Exponential backoff
  message_ttl_hours: 24,
  batch_size: 50,
  flush_interval_ms: 2000
};
```

#### Queue Endpoints

**POST /api/queue/messages**
Enqueue a message for delivery
```json
Request:
{
  "user_id": "uuid",
  "type": "task_completed",
  "priority": "high" | "normal" | "low",
  "payload": {},
  "deduplicate_key": "string?",  // Prevent duplicate messages
  "ttl_hours": 24
}

Response:
{
  "message_id": "msg_123",
  "queued_at": "ISO date",
  "estimated_delivery": "ISO date"
}
```

**GET /api/queue/pending**
Retrieve pending messages for a user
```json
Query params:
- limit: number (default 50, max 100)
- since: ISO date

Response:
{
  "messages": [
    {
      "id": "msg_123",
      "type": "task_completed",
      "payload": {},
      "queued_at": "ISO date",
      "attempts": 1
    }
  ],
  "has_more": true
}
```

**POST /api/queue/acknowledge**
Acknowledge message delivery
```json
Request:
{
  "message_ids": ["msg_123", "msg_124"]
}

Response:
{
  "acknowledged": 2,
  "failed": 0
}
```

### Batch Notification Strategy

#### Notification Batching Rules
To reduce notification fatigue and improve performance:

1. **Batch window**: 5 minutes for non-urgent notifications
2. **Maximum batch size**: 10 notifications per batch
3. **Urgent notifications**: Delivered immediately (task assignments, @mentions)
4. **Digest delivery**: Batched notifications sent as single digest

#### Notification Batch Endpoint

**GET /api/notifications/batch**
```json
Query params:
- unread_only: boolean (default true)
- limit: number (default 20)

Response:
{
  "batches": [
    {
      "id": "batch_123",
      "type": "task_activity",
      "count": 5,
      "created_at": "ISO date",
      "preview": "5 tasks completed in Living Room",
      "notifications": [
        {
          "id": "notif_1",
          "type": "task_completed",
          "actor": {
            "id": "uuid",
            "name": "John"
          },
          "target": {
            "id": "uuid",
            "type": "task",
            "title": "Vacuum living room"
          },
          "created_at": "ISO date"
        }
      ]
    }
  ],
  "unread_count": 15
}
```

**POST /api/notifications/batch/settings**
Configure batching preferences
```json
Request:
{
  "batch_window_minutes": 5,
  "max_batch_size": 10,
  "excluded_types": ["streak_reminder"],  // Never batch these
  "quiet_hours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00",
    "timezone": "America/New_York"
  }
}
```

### Channel Management

#### Dynamic Channel Subscription
Efficiently manage which channels a user subscribes to:

**POST /api/channels/subscribe**
```json
Request:
{
  "channels": [
    {
      "type": "household",
      "id": "uuid",
      "events": ["tasks", "messages", "members"]
    },
    {
      "type": "room",
      "id": "uuid",
      "events": ["notes"]
    }
  ]
}

Response:
{
  "subscribed": 2,
  "active_channels": [
    {
      "channel_id": "household:abc123",
      "event_count": 3,
      "established_at": "ISO date"
    }
  ]
}
```

**POST /api/channels/unsubscribe**
```json
Request:
{
  "channel_ids": ["household:abc123", "room:xyz789"]
}

Response:
{
  "unsubscribed": 2
}
```

**GET /api/channels/active**
List active channel subscriptions
```json
Response:
{
  "channels": [
    {
      "channel_id": "household:abc123",
      "type": "household",
      "events": ["tasks", "messages"],
      "message_count_today": 45,
      "subscribed_at": "ISO date",
      "last_message_at": "ISO date"
    }
  ],
  "total": 3,
  "connection_limit_remaining": 2
}
```

#### Channel Event Filters
Reduce unnecessary updates by filtering events:

```javascript
// Example: Subscribe only to specific task statuses
supabase.channel('tasks:filtered')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'tasks',
    filter: `household_id=eq.${householdId} AND status=eq.completed`
  }, handleTaskCompleted)

// Example: Subscribe only to messages mentioning current user
supabase.channel('chat:mentions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `household_id=eq.${householdId} AND content.ilike.%@${username}%`
  }, handleMention)
```

#### Presence Management
Track online/offline status efficiently:

**POST /api/presence/update**
```json
Request:
{
  "status": "online" | "away" | "offline",
  "last_seen_at": "ISO date"
}
```

**GET /api/presence/household/:id**
```json
Response:
{
  "members": [
    {
      "member_id": "uuid",
      "name": "John",
      "status": "online",
      "last_seen_at": "ISO date",
      "current_activity": "viewing_tasks"  // Optional
    }
  ]
}
```

#### Rate Limiting for Real-time Operations
```json
Rate limits per user:
- Channel subscriptions: 10 per minute
- Message queue enqueue: 100 per minute
- Presence updates: 20 per minute
- Batch notification fetch: 30 per minute

Response headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635789600
```