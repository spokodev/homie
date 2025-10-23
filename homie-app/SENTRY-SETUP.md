# Sentry Error Tracking Setup

## Overview

HomieLife uses Sentry for production error tracking and monitoring. Sentry automatically captures:
- JavaScript errors
- Unhandled promise rejections
- React component errors
- Network failures
- Custom logged errors

## Setup Instructions

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account (100k events/month free)
3. Create a new project:
   - Platform: **React Native**
   - Project name: **homielife-app**
   - Team: Your team name

### 2. Get Your DSN

1. After creating the project, copy your DSN from the setup page
2. It looks like: `https://1234567890abcdef@o123456.ingest.sentry.io/1234567`
3. Add it to your `.env` file:

```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-actual-dsn@sentry.io/project-id
```

### 3. Configure Source Maps (For Production Builds)

For readable stack traces in production, configure source maps in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "SENTRY_ORG": "your-org-slug",
        "SENTRY_PROJECT": "homielife-app",
        "SENTRY_AUTH_TOKEN": "your-auth-token"
      }
    }
  }
}
```

To get your auth token:
1. Go to Sentry → Settings → Account → API → Auth Tokens
2. Create a new token with `project:write` scope
3. Add it to your EAS secrets:

```bash
eas secret:create --name SENTRY_AUTH_TOKEN --value your-token --type string
```

### 4. Test Error Tracking

In development, Sentry is disabled. To test in production mode:

```bash
# Build a production bundle
npm run build:prod

# Or test with EAS Preview
eas build --profile preview --platform ios
```

Trigger a test error:

```typescript
import * as Sentry from '@sentry/react-native';

// Throw a test error
Sentry.captureException(new Error('Test error from HomieLife'));

// Or trigger a real error
throw new Error('Testing Sentry integration');
```

## What's Already Integrated

### 1. Automatic Error Capture

All unhandled errors are automatically sent to Sentry:
- React component errors (via Error Boundary)
- Promise rejections
- Native crashes (iOS/Android)

### 2. User Context

User information is automatically attached to all errors:
- User ID
- Email
- Username

This happens in `AuthContext.tsx` when users sign in.

### 3. Custom Error Logging

Use the `logError` function for custom error tracking:

```typescript
import { logError } from '@/utils/errorHandling';

try {
  await someRiskyOperation();
} catch (error) {
  logError(error, 'Task Creation');
}
```

This will:
- Log to console in development
- Send to Sentry in production
- Include context and error codes

### 4. Transaction Tracking

Performance monitoring is enabled with 100% sampling rate:
- API call duration
- Screen load times
- User interactions

## Viewing Errors in Sentry

1. Go to your Sentry dashboard
2. Click on your project: **homielife-app**
3. View Issues tab to see all errors
4. Each error includes:
   - Stack trace
   - User context
   - Device info
   - Breadcrumbs (events leading to error)
   - Tags (error code, context)

## Best Practices

### 1. Add Context to Errors

```typescript
Sentry.captureException(error, {
  tags: {
    feature: 'task-management',
    action: 'create-task',
  },
  extra: {
    taskData: sanitizedTaskData,
  },
});
```

### 2. Set Custom Tags

```typescript
Sentry.setTag('household_size', household.memberCount);
Sentry.setTag('premium_user', user.isPremium);
```

### 3. Add Breadcrumbs

```typescript
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
});
```

### 4. Filter Sensitive Data

Sentry automatically filters:
- Passwords
- Tokens
- API keys

But you should also sanitize custom data:

```typescript
const sanitizedData = {
  ...taskData,
  userToken: '[Filtered]',
};
```

## Disable Sentry in Development

Sentry is automatically disabled in development (`__DEV__ === true`).

To test Sentry in development, temporarily change in `app/_layout.tsx`:

```typescript
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: true, // Change from !__DEV__
  // ...
});
```

## Alerting Rules

Configure alerts in Sentry dashboard:

1. Go to Settings → Alerts
2. Create alert rules:
   - Email on new issues
   - Slack notifications for high-volume errors
   - PagerDuty for critical errors

## Cost Optimization

Free tier includes 100k events/month. To optimize:

1. **Sample Less Critical Errors**:
```typescript
Sentry.init({
  tracesSampleRate: 0.5, // Sample 50% of transactions
});
```

2. **Filter Out Expected Errors**:
```typescript
beforeSend(event, hint) {
  if (event.exception?.values?.[0]?.type === 'NetworkError') {
    return null; // Don't send to Sentry
  }
  return event;
}
```

3. **Set Rate Limits**: In Sentry dashboard, set max events per minute

## Troubleshooting

### Source Maps Not Working

1. Ensure `SENTRY_AUTH_TOKEN` is set in EAS secrets
2. Check that build includes source maps: `eas build --profile production`
3. Verify source maps uploaded: Check Sentry → Settings → Source Maps

### Errors Not Appearing

1. Check DSN is correct in `.env`
2. Verify `enabled: true` in production builds
3. Test with: `Sentry.captureException(new Error('Test'))`
4. Check Sentry dashboard for quota limits

### Too Many Events

1. Lower `tracesSampleRate` to 0.2 (20%)
2. Add `beforeSend` filter for common errors
3. Set inbound filters in Sentry dashboard

## Support

- Sentry Docs: https://docs.sentry.io/platforms/react-native/
- Expo + Sentry: https://docs.expo.dev/guides/using-sentry/
- HomieLife Issues: Open a GitHub issue
