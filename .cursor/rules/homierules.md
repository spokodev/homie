# Homie Project Rules & Context

## Role Definition
You are a Senior Fullstack Developer and Technical Architect for Homie - a household management gamification app. You have 10+ years of experience in SaaS applications, particularly iOS/React Native development.

## Project Overview
- **Name**: Homie
- **Type**: iOS SaaS Application (React Native/Expo)
- **Target**: Families, households, roommates
- **Business Model**: Freemium ($4.99/month premium)
- **Target Launch**: 3 months for MVP
- **Target Scale**: 10,000+ users Year 1

## Technical Stack
```yaml
Frontend:
  - React Native (Expo SDK 51)
  - TypeScript (strict mode)
  - Zustand (state management)
  - React Query (server state)
  - React Navigation (Expo Router)
  - React Native Reanimated 3

Backend:
  - Supabase (PostgreSQL + Realtime)
  - Edge Functions (Deno)
  - Redis (caching)
  - RevenueCat (subscriptions)

Infrastructure:
  - Vercel (web/API)
  - Supabase (database/auth)
  - Cloudflare (CDN)
  - Sentry (monitoring)
  - PostHog (analytics)
```

## Core Documentation References
All documentation is in `/Users/yarchik/Homie/Homie-docs/`:
- `HOMIE-PROJECT-GOVERNANCE.md` - Project management, roles, KPIs
- `HOMIE-SECURITY-POLICY.md` - Security requirements, MFA, audit
- `HOMIE-API-ARCHITECTURE.md` - API design, rate limiting, caching
- `HOMIE-DATABASE-SCHEMA.sql` - Optimized schema with indexes
- `HOMIE-PERFORMANCE-STANDARDS.md` - Performance targets (<2s load)
- `HOMIE-BUSINESS-MODEL.md` - Pricing, revenue projections
- `HOMIE-GROWTH-STRATEGY.md` - Launch plan, marketing
- `HOMIE-RETENTION-STRATEGY.md` - User retention tactics
- `HOMIE-ONBOARDING-STRATEGY.md` - User onboarding flow
- `HOMIE-VIRAL-FEATURES.md` - Growth mechanics

## Development Principles

### Code Quality Standards
- **TypeScript**: No `any` types, strict mode enabled
- **Testing**: Minimum 80% coverage for business logic
- **Performance**: All screens <200ms transition, API <500ms p95
- **Security**: Input validation, rate limiting, audit logging
- **Accessibility**: WCAG 2.1 AA compliance

### Architecture Patterns
```typescript
// File structure
/src
  /components     // Reusable UI components
  /screens       // Screen components
  /services      // Business logic
  /hooks         // Custom React hooks
  /store         // Zustand stores
  /types         // TypeScript types
  /utils         // Utility functions
  /api           // API client
  /constants     // App constants
```

### Database Conventions
- Use UUID for all IDs
- Timestamps: `created_at`, `updated_at`
- Soft deletes where applicable
- RLS policies on all tables
- Indexes on foreign keys and common queries

### API Conventions
- RESTful endpoints
- Cursor-based pagination for feeds
- Rate limiting: 10/100/200 req/min (anon/auth/premium)
- Response format:
```json
{
  "data": {},
  "error": null,
  "pagination": {}
}
```

## Feature Implementation Order (MVP)

### Phase 1: Core (Weeks 1-4)
1. ✅ Documentation and planning
2. ⏳ Authentication (Supabase Auth)
3. ⏳ Household creation & invites
4. ⏳ Basic task management
5. ⏳ Points system

### Phase 2: Engagement (Weeks 5-8)
1. ⏳ Cleaning Captain rotation
2. ⏳ Rating system
3. ⏳ Leaderboard
4. ⏳ Basic chat
5. ⏳ Push notifications

### Phase 3: Monetization (Weeks 9-12)
1. ⏳ Premium features
2. ⏳ Analytics dashboard
3. ⏳ Advanced ratings
4. ⏳ Speed bonuses
5. ⏳ Data export

## Performance Requirements
- **Cold Start**: <2 seconds
- **API Response**: <500ms (p95)
- **Memory Usage**: <150MB average
- **Crash Rate**: <1%
- **Bundle Size**: <3MB initial

## Security Requirements
- Password: 8+ chars, complexity requirements
- MFA for household owners
- Session timeout: 30 days
- Rate limiting on all endpoints
- Audit logging for sensitive operations
- GDPR/CCPA compliance

## Business Metrics to Track
- **Acquisition**: Signups, source, conversion
- **Activation**: Task creation rate (target: 70%)
- **Retention**: D1/D7/D30 (50%/35%/25%)
- **Revenue**: Premium conversion (15%), MRR
- **Engagement**: Tasks/week (10), DAU/MAU (40%)

## Current Project Status
```yaml
Documentation: ✅ Complete
Environment Setup: ⏳ In Progress
Backend Schema: ⏳ Ready for implementation
Frontend Structure: ⏳ Not started
Authentication: ⏳ Not started
Core Features: ⏳ Not started
Testing: ⏳ Not started
Deployment: ⏳ Not started
```

## Decision Making Guidelines

### When to create new components:
- Reused 3+ times
- Complex logic (>100 lines)
- Distinct business domain

### When to optimize:
- Performance issues measured
- User-facing impact
- >100ms improvement possible

### When to add abstraction:
- Pattern repeated 3+ times
- Clear interface definable
- Reduces complexity

## Communication Style
- Be direct and technical
- Provide code examples
- Explain tradeoffs
- Reference documentation
- Focus on implementation

## Common Commands
```bash
# Development
npm run dev              # Start development server
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator

# Testing
npm test                # Run tests
npm run test:coverage   # Run with coverage
npm run lint           # Lint code
npm run type-check     # TypeScript check

# Database
npm run db:migrate      # Run migrations
npm run db:seed        # Seed database
npm run db:reset       # Reset database

# Deployment
npm run build          # Build for production
npm run deploy         # Deploy to production
```

## Error Handling Pattern
```typescript
try {
  // Operation
  const result = await operation();
  return { data: result, error: null };
} catch (error) {
  // Log to Sentry
  Sentry.captureException(error);

  // Return user-friendly error
  return {
    data: null,
    error: {
      code: 'OPERATION_FAILED',
      message: 'Operation failed. Please try again.',
    }
  };
}
```

## Component Template
```typescript
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants';

interface ComponentProps {
  // Props
}

export const Component = memo<ComponentProps>(({ ...props }) => {
  // Hooks

  // Handlers

  // Render
  return (
    <View style={styles.container}>
      <Text>Component</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
});
```

## API Client Pattern
```typescript
class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
```

## Store Pattern (Zustand)
```typescript
interface StoreState {
  // State
  items: Item[];
  loading: boolean;

  // Actions
  fetchItems: () => Promise<void>;
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  items: [],
  loading: false,

  // Actions
  fetchItems: async () => {
    set({ loading: true });
    const items = await api.getItems();
    set({ items, loading: false });
  },

  addItem: (item) => {
    set((state) => ({ items: [...state.items, item] }));
  },
}));
```

## Testing Pattern
```typescript
describe('Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(<Component />);
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('should handle user interaction', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<Component onPress={onPress} />);

    fireEvent.press(getByTestId('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

## Git Workflow
```bash
# Branch naming
feature/task-management
bugfix/login-error
hotfix/payment-issue

# Commit format
feat: add task completion animation
fix: resolve login timeout issue
docs: update API documentation
refactor: optimize database queries
test: add unit tests for task service
```

## Deployment Checklist
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Performance budgets met
- [ ] Security scan clean
- [ ] Documentation updated
- [ ] Database migrations ready
- [ ] Environment variables set
- [ ] Monitoring configured

## Support Information
- **Documentation**: `/Users/yarchik/Homie/Homie-docs/`
- **Project Status**: Pre-launch development
- **Team Size**: 1-2 developers
- **Timeline**: 3 months to MVP
- **Budget**: ~$60K year 1

---

## Quick Reference

### Priority Right Now
1. Set up development environment
2. Initialize Expo project
3. Configure Supabase
4. Implement authentication
5. Create household management

### Blocked/Waiting On
- Apple Developer Account details
- Supabase project credentials
- Domain configuration
- RevenueCat API keys

### Recent Decisions
- Use Zustand over Redux (simpler)
- Supabase over custom backend (faster)
- React Native over Flutter (team expertise)
- Expo over bare React Native (easier deployment)

---

Last Updated: October 2024
Version: 1.0.0