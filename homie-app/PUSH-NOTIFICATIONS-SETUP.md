# Push Notifications System - Setup Guide

## Overview

HomieLife app має повну систему push-нотифікацій з автоматичною відправкою при різних подіях.

## Architecture

```
User Action (create task, send message)
    ↓
Database Trigger
    ↓
send_push_notification() function
    ↓
notification_queue table
    ↓
Notification Processor (React Native)
    ↓
Expo Push API
    ↓
User's Device
```

## Components

### 1. Database Layer

**Tables:**
- `push_tokens` - Expo push tokens для кожного користувача
- `notification_preferences` - Налаштування які типи нотифікацій отримувати
- `notifications` - Історія всіх нотифікацій
- `notification_queue` - Черга нотифікацій для відправки

**Triggers:**
- `task_assigned_notification` - При призначенні таску
- `task_completed_notification` - При завершенні таску
- `new_message_notification` - При новому повідомленні

**Migrations:**
- `009_push_notifications.sql` - Основні таблиці та triggers
- `010_push_notification_integration.sql` - Система черги

### 2. React Native Layer

**Hooks:**
- `useNotifications()` - Реєстрація push tokens, обробка вхідних нотифікацій
- `useNotificationPreferences()` - Керування налаштуваннями
- `useNotificationHistory()` - Історія нотифікацій

**Services:**
- `notificationService.ts` - Обробка черги, відправка через Expo API
- `notifications.ts` - Utilities для роботи з нотифікаціями

**Screens:**
- `notification-settings.tsx` - UI для налаштувань
- `notifications.tsx` - Історія нотифікацій

### 3. Supabase Edge Function (Optional)

**Function:**
- `send-push-notification/index.ts` - Edge function для відправки через Expo API

## Notification Types

| Type | Trigger | Recipients |
|------|---------|-----------|
| `task_assigned` | Task призначений користувачу | Assignee |
| `task_completed` | Task завершено | Всі учасники household (крім того хто завершив) |
| `task_due_soon` | Дедлайн наближається | Assignee |
| `message` | Нове повідомлення в чаті | Всі учасники (крім відправника) |
| `captain_rotation` | Зміна капітана | Всі учасники |
| `rating_request` | Запит оцінити капітана | Користувач |

## Setup Instructions

### Step 1: Run Migrations

```bash
# Apply migrations to your Supabase project
# 009_push_notifications.sql
# 010_push_notification_integration.sql
```

### Step 2: Configure Permissions

Ensure users have proper permissions:
- `authenticated` users can read/write their own `push_tokens`
- `authenticated` users can read/write their own `notification_preferences`

### Step 3: Test Notification Flow

1. **Register Push Token:**
   - User enables notifications in app
   - Token saved to `push_tokens` table

2. **Create Test Event:**
   - Create a task and assign it to someone
   - Database trigger fires
   - Notification added to queue

3. **Process Queue:**
   - Notification processor runs every 30 seconds
   - Sends via Expo Push API
   - Updates delivery status

### Step 4: Deploy Edge Function (Optional)

```bash
# Deploy to Supabase
supabase functions deploy send-push-notification

# Set environment variables
supabase secrets set EXPO_PUSH_URL=https://exp.host/--/api/v2/push/send
```

## User Experience

### Enable Notifications

1. User goes to **Settings → Notification Settings**
2. Toggle "Enable Push Notifications"
3. App requests permission
4. Token saved to database

### Configure Preferences

User can enable/disable specific notification types:
- ✅ Task Assigned
- ✅ Task Completed
- ✅ Task Due Soon
- ✅ New Messages
- ✅ Captain Rotation
- ✅ Rating Requests

### Receive Notifications

When notification arrives:
- Shows banner/alert
- Plays sound
- Adds badge to app icon
- User can tap to navigate to relevant screen

## Monitoring

### Check Notification Queue

```sql
-- View pending notifications
SELECT * FROM notification_queue WHERE status = 'pending';

-- View failed notifications
SELECT * FROM notification_queue WHERE status = 'failed';

-- View delivery stats
SELECT
  type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE delivered = true) as delivered,
  COUNT(*) FILTER (WHERE delivered = false) as failed
FROM notifications
GROUP BY type;
```

### Process Queue Manually

```sql
-- Process up to 10 notifications
SELECT process_notification_queue(10);
```

## Troubleshooting

### Notifications Not Sending

1. **Check push token:**
   ```sql
   SELECT * FROM push_tokens WHERE member_id = 'user-id';
   ```

2. **Check preferences:**
   ```sql
   SELECT * FROM notification_preferences WHERE member_id = 'user-id';
   ```

3. **Check queue:**
   ```sql
   SELECT * FROM notification_queue WHERE status = 'failed';
   ```

4. **Validate Expo token format:**
   - Should start with `ExponentPushToken[`
   - Example: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

### Permissions Issues

Ensure device settings allow notifications:
- iOS: Settings → HomieLife → Notifications → Allow Notifications
- Android: Settings → Apps → HomieLife → Notifications → Allow

## Performance

- Queue processed every 30 seconds
- Batch size: 10 notifications
- Max retry attempts: 3
- Failed notifications marked after 3 attempts

## Future Enhancements

- [ ] Scheduled notifications for task due reminders
- [ ] Rich notifications with images
- [ ] Notification actions (Complete task from notification)
- [ ] Badge count management
- [ ] Silent notifications for data sync
- [ ] Notification categories/channels

## Security

- RLS policies ensure users only access their own tokens/preferences
- Push tokens encrypted in transit
- Edge function uses service role for database access
- Expo handles push notification delivery securely
