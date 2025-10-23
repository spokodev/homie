# HomieLife Testing Guide

Complete guide for testing HomieLife application at all levels.

## Table of Contents
- [Local Development Testing](#local-development-testing)
- [Unit & Integration Tests](#unit--integration-tests)
- [Manual Testing Checklist](#manual-testing-checklist)
- [Database Testing](#database-testing)
- [Production Testing](#production-testing)
- [Performance Testing](#performance-testing)

---

## Local Development Testing

### Prerequisites
```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Install Expo CLI globally
npm install -g expo-cli
```

### Starting the Development Server

```bash
cd homie-app

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Or with cache clearing
npx expo start --clear
```

### Testing Options

1. **iOS Simulator** (Mac only):
   - Press `i` in terminal
   - Requires Xcode installed
   - Automatic simulator launch

2. **Android Emulator**:
   - Press `a` in terminal
   - Requires Android Studio
   - AVD (Android Virtual Device) configured

3. **Physical Device (Recommended)**:
   - Install Expo Go from App Store/Play Store
   - Scan QR code from terminal
   - Best for testing real-world performance

4. **Web Browser**:
   - Press `w` in terminal
   - Limited functionality (no native features)

---

## Unit & Integration Tests

### Running All Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Running Specific Test Suites

```bash
# Test specific hook
npm test -- useRecurringTasks

# Test validation utilities
npm test -- validation

# Test gamification logic
npm test -- gamification

# Test specific file
npm test -- src/hooks/__tests__/useTasks.test.ts
```

### Test Coverage Report

```bash
# Generate coverage report
npm test -- --coverage --watchAll=false

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Current Test Statistics
- **166+ Integration Tests**
- **Coverage**: Hooks, utilities, validation
- **Test Files**: 8+ test suites
- **Frameworks**: Jest + React Testing Library

---

## Manual Testing Checklist

### ✅ Authentication Flow
- [ ] Sign up with new email
- [ ] Login with existing credentials
- [ ] Logout functionality
- [ ] Session persistence (app restart)
- [ ] Invalid credentials handling

### ✅ Onboarding Flow
- [ ] Create household with name and icon
- [ ] Add first member (yourself)
- [ ] Welcome tour displays correctly
- [ ] Skip onboarding works
- [ ] Return to onboarding if incomplete

### ✅ Task Management
- [ ] Create new task
- [ ] Edit task details
- [ ] Delete task
- [ ] Complete task (points awarded)
- [ ] Assign task to member
- [ ] Filter by category
- [ ] Sort by date/points/alphabetical
- [ ] View overdue tasks indicator
- [ ] Quick task templates work

### ✅ Recurring Tasks
- [ ] Create daily recurring task
- [ ] Create weekly recurring task (specific days)
- [ ] Create monthly recurring task
- [ ] Pause/resume recurring task
- [ ] Delete recurring task
- [ ] Auto-generation on app start
- [ ] Manual "Generate Now" works
- [ ] View next occurrence time

### ✅ Notifications
- [ ] Request notification permission
- [ ] Receive test notification
- [ ] Tap notification navigates correctly
- [ ] View notification history
- [ ] Dismiss individual notification
- [ ] Clear all notifications
- [ ] Enable/disable in settings

### ✅ Gamification
- [ ] Points awarded on task completion
- [ ] Level up animation
- [ ] Streak counter increments
- [ ] Leaderboard updates
- [ ] Badge earned notification
- [ ] View all badges

### ✅ Captain System
- [ ] Captain assigned on household creation
- [ ] Weekly rotation (test with manual trigger)
- [ ] Rate captain (1-5 stars)
- [ ] View captain stats
- [ ] Bonus points awarded for good ratings

### ✅ Chat
- [ ] Send message
- [ ] Receive real-time message
- [ ] Delete message (admin only)
- [ ] Auto-scroll to latest
- [ ] Member avatars display

### ✅ Rooms & Notes
- [ ] Create room
- [ ] Add sticky note
- [ ] Pin/unpin note
- [ ] Delete note
- [ ] Free tier limit (3 notes)
- [ ] Premium tier unlimited notes

### ✅ Member Management
- [ ] Add family member
- [ ] Add pet
- [ ] View member stats
- [ ] Delete member (admin only)
- [ ] Edit member profile

### ✅ Settings
- [ ] Toggle notifications
- [ ] View household info
- [ ] Access recurring tasks
- [ ] Navigate to notification center
- [ ] App version displayed

---

## Database Testing

### Supabase Setup

1. **Create Supabase Project**:
   - Go to https://supabase.com
   - Create new project
   - Note URL and anon key

2. **Run Migrations**:
   ```sql
   -- Copy all SQL from DATABASE_SCHEMA.md
   -- Run in Supabase SQL Editor
   -- Enable Row Level Security
   ```

3. **Test RLS Policies**:
   ```sql
   -- Try accessing another household's data (should fail)
   SELECT * FROM tasks WHERE household_id = 'other-household-id';
   ```

4. **Test Real-time**:
   - Open two devices/browsers
   - Send message in chat
   - Verify real-time update

### Database Validation

```bash
# Connect to Supabase
psql "postgresql://[connection-string]"

# Check all tables exist
\dt

# Check indexes
\di

# Verify RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

---

## Production Testing (Pre-Launch)

### Environment Setup

1. **Update .env.production**:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-production-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-key
   EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
   EXPO_PUBLIC_POSTHOG_API_KEY=your-posthog-key
   ```

2. **Build Production Version**:
   ```bash
   # Install EAS CLI
   npm install -g eas-cli

   # Login to Expo
   eas login

   # Configure project
   eas build:configure

   # Build for iOS
   eas build --platform ios --profile production

   # Build for Android
   eas build --platform android --profile production
   ```

### Pre-Launch Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Sentry configured and receiving errors
- [ ] PostHog receiving analytics events
- [ ] Push notifications working on physical devices
- [ ] App icons and splash screens correct
- [ ] Privacy policy and terms added
- [ ] App store metadata prepared

### Beta Testing

1. **TestFlight (iOS)**:
   ```bash
   # Build and submit to TestFlight
   eas build --platform ios --profile production
   eas submit --platform ios
   ```

2. **Google Play Internal Testing**:
   ```bash
   # Build and submit to Play Console
   eas build --platform android --profile production
   eas submit --platform android
   ```

3. **Invite Beta Testers**:
   - 5-10 users from different households
   - Mix of iOS and Android
   - Different device models
   - Various network conditions

---

## Performance Testing

### Measuring Load Times

```typescript
// Use built-in performance utilities
import { measureAsync } from '@/utils/performance-utils';

const tasks = await measureAsync('fetchTasks', async () => {
  return await fetchTasks();
});
// Check Sentry for transaction timing
```

### Network Throttling

1. **Chrome DevTools**:
   - Open web version
   - Network tab → Throttling
   - Test "Slow 3G", "Fast 3G"

2. **Charles Proxy** (Mobile):
   - Install Charles Proxy
   - Configure device proxy
   - Throttle network speed
   - Test app performance

### Memory Profiling

```bash
# React Native Performance Monitor
# Shake device → Show Perf Monitor

# Check for memory leaks
# Monitor RAM usage during long sessions
# Verify no memory spikes
```

### Bundle Size Analysis

```bash
# Generate bundle stats
npx expo export --experimental-bundle

# Analyze bundle size
# Check for large dependencies
# Optimize if needed
```

---

## Stress Testing

### High Load Scenarios

1. **Many Tasks**:
   - Create 100+ tasks
   - Test filtering performance
   - Test scrolling smoothness

2. **Large Household**:
   - Add maximum members (free: 5, premium: many)
   - Test leaderboard performance
   - Test chat with many participants

3. **Heavy Notification Load**:
   - Send multiple notifications
   - Test notification center scrolling
   - Verify no crashes

4. **Long Session**:
   - Keep app open for 1+ hours
   - Monitor memory usage
   - Check for performance degradation

---

## Security Testing

### Authentication

- [ ] Cannot access app without login
- [ ] Session expires after logout
- [ ] Token refresh works
- [ ] Invalid tokens rejected

### Authorization

- [ ] Cannot view other household's data
- [ ] Non-admin cannot delete members
- [ ] Task creator can edit/delete own tasks
- [ ] RLS policies enforced

### Input Validation

- [ ] XSS attempts blocked
- [ ] SQL injection prevented
- [ ] Long strings handled gracefully
- [ ] Special characters sanitized

---

## Regression Testing

After each update, verify:

- [ ] Existing tasks still work
- [ ] Points calculated correctly
- [ ] Notifications still arrive
- [ ] Real-time chat functioning
- [ ] No new TypeScript errors
- [ ] All tests passing

---

## Bug Reporting Template

When you find a bug, report with:

```markdown
**Bug Title**: [Clear, concise title]

**Environment**:
- Device: [iPhone 14, Pixel 7, etc.]
- OS: [iOS 17.2, Android 13, etc.]
- App Version: [1.0.0]

**Steps to Reproduce**:
1. Go to...
2. Click on...
3. See error...

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots/Logs**:
[Attach if available]

**Severity**: [Critical/High/Medium/Low]
```

---

## Automated Testing (Future)

### E2E Tests with Detox

```bash
# Install Detox
npm install --save-dev detox

# Configure Detox
# Create e2e/firstTest.e2e.ts

# Run E2E tests
npm run e2e
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Upload coverage
        run: npm run coverage
```

---

## Testing Best Practices

1. **Test on Real Devices**: Simulators/emulators don't catch all issues
2. **Test Different Networks**: WiFi, 4G, 3G, offline
3. **Test Different Permissions**: Allow/deny notifications, camera, etc.
4. **Test Edge Cases**: Empty states, maximum data, minimum data
5. **Test Interruptions**: Phone calls, app switching, low battery
6. **Test Updates**: Fresh install vs upgrade from previous version

---

## Quick Test Commands Reference

```bash
# Development
npx expo start                    # Start dev server
npx expo start --clear           # Clear cache and start

# Testing
npm test                         # Run all tests
npm test -- --watch             # Watch mode
npm test -- --coverage          # Coverage report
npm test -- useRecurringTasks   # Specific test

# Building
eas build --platform ios         # iOS build
eas build --platform android     # Android build

# Type Checking
npx tsc --noEmit                # Check TypeScript errors

# Linting
npm run lint                     # Run ESLint
```

---

## Support & Resources

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Supabase Docs**: https://supabase.com/docs
- **Testing Library**: https://testing-library.com/react-native

---

**Last Updated**: 2025-01-23
**Version**: 1.0.0
