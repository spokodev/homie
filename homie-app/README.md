# 🏠 Homie - Family Home Management App

Transform household chores into a joyful family game!

## 📱 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (already installed)
- Xcode (for iOS development)
- iOS Simulator or physical iPhone

### 🚀 Quick Start

1. **Set up environment variables**
   ```bash
   cp .env.local.template .env.local
   ```

   Edit `.env.local` and add your credentials:
   - Supabase URL and Anon Key
   - RevenueCat API keys (optional for now)
   - Sentry DSN (optional for now)
   - PostHog API key (optional for now)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your iPhone**

   **Option A: Using Expo Go (Quick testing)**
   - Download "Expo Go" app from App Store
   - Scan the QR code shown in terminal
   - The app will load on your phone

   **Option B: Development Build (Full features)**
   ```bash
   # Create a development build
   npx expo run:ios

   # Or use EAS Build
   eas build --platform ios --profile development
   ```

### 📲 Installing on Your iPhone

#### For Development Testing:
1. Make sure your iPhone and Mac are on the same WiFi
2. Run `npm start` in terminal
3. Press `i` to open in iOS Simulator
4. Or scan QR code with Camera app to open in Expo Go

#### For TestFlight Distribution:
1. **Configure Apple Developer settings**
   - Update Bundle ID in `app.json`
   - Add your Apple Team ID to `.env.local`

2. **Build for TestFlight**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit to TestFlight**
   ```bash
   eas submit --platform ios
   ```

### 🔑 Required Credentials

Create accounts and get your keys from:

1. **Supabase** (Backend)
   - Go to https://supabase.com
   - Create new project
   - Get URL and Anon Key from Settings > API

2. **Apple Developer** (iOS deployment)
   - Enroll at https://developer.apple.com
   - Create App ID and Provisioning Profiles
   - Set up push notification certificates

3. **RevenueCat** (Subscriptions - optional)
   - Sign up at https://www.revenuecat.com
   - Create new project
   - Get API keys

4. **Sentry** (Error tracking - optional)
   - Sign up at https://sentry.io
   - Create React Native project
   - Get DSN

### 📁 Project Structure

```
homie-app/
├── app/                  # Expo Router screens
│   ├── (auth)/          # Authentication flow
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/          # Main app tabs
│   │   ├── home.tsx
│   │   ├── tasks.tsx
│   │   ├── chat.tsx
│   │   ├── leaderboard.tsx
│   │   └── profile.tsx
│   ├── (modals)/        # Modal screens
│   │   ├── create-task.tsx
│   │   ├── task-details.tsx
│   │   ├── add-member.tsx
│   │   ├── household-members.tsx
│   │   ├── household-settings.tsx
│   │   ├── edit-profile.tsx
│   │   ├── rate-captain.tsx
│   │   └── settings.tsx
│   └── _layout.tsx      # Root layout
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Form/        # Form inputs
│   │   └── Toast/       # Toast notifications
│   ├── contexts/        # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── HouseholdContext.tsx
│   ├── hooks/          # Custom React hooks
│   │   ├── useTasks.ts
│   │   ├── useMembers.ts
│   │   ├── useCaptain.ts
│   │   ├── useRatings.ts
│   │   └── useBadges.ts
│   ├── lib/            # Libraries
│   │   └── supabase.ts
│   ├── stores/         # Zustand state stores
│   │   ├── app.store.ts
│   │   └── premium.store.ts
│   ├── theme/          # Design system
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities
│   │   ├── validation.ts
│   │   ├── gamification.ts
│   │   └── analytics.ts
│   └── constants/      # App constants
│       └── index.ts     # Categories, avatars, icons
├── assets/             # Images, fonts
├── __tests__/          # Jest tests
└── app.json           # Expo configuration
```

### 🛠 Available Scripts

```bash
# Start development server
npm start

# Run on iOS Simulator
npm run ios

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build:ios
```

### 🎨 Design System

The app uses a cheerful, family-friendly design:
- **Primary**: Coral Red (#FF6B6B)
- **Secondary**: Teal (#4ECDC4)
- **Accent**: Yellow (#FFD93D)
- **Typography**: Cabinet Grotesk (headings), Inter (body)

### ✨ Key Features

1. **Task Management**
   - Create tasks with titles, descriptions, and rooms
   - Assign tasks to specific family members or pets
   - Set due dates with quick presets (2 hours, tomorrow, next week)
   - Categorize tasks (Cleaning, Kitchen, Bathroom, Pet Care, etc.)
   - Automatic points calculation (5 minutes = 1 point)
   - Quick task templates for common chores

2. **Captain System**
   - Weekly captain rotation (auto-selects least-captained member)
   - Rate captains with 1-5 stars
   - Bonus points for high ratings (rating × 20 for 4-5 stars)
   - Captain stats tracking (times captain, average rating)
   - Prevent duplicate ratings per rotation

3. **Household Management**
   - Edit household name and icon (admin only)
   - View household statistics (members, tasks, points)
   - Manage family members and pets
   - Delete household (admin only, with confirmation)
   - Admin access controls

4. **Gamification**
   - Points system based on task completion time
   - Level progression with color-coded badges
   - Leaderboard rankings
   - Streak tracking for consecutive days
   - Achievement badges (free and premium tiers)

5. **Family Chat**
   - Real-time messaging
   - Emoji support
   - Message read receipts
   - Typing indicators

6. **Profile & Settings**
   - Edit profile (name and avatar)
   - Choose from 24 avatar options
   - View captain stats and badges
   - Household settings (admin only)
   - App settings (notifications, etc.)

### 🧪 Testing the App

1. **Welcome Flow**
   - Open app → See welcome screen
   - Tap "Get Started" → Sign up screen
   - Create account → Onboarding

2. **Main Features to Test**
   - Home dashboard with captain card and quick actions
   - Create tasks with categories and due dates
   - Assign tasks to members
   - Complete tasks and earn points
   - View leaderboard rankings
   - Rate the captain
   - Manage family members and household settings (if admin)
   - Chat with family members
   - Edit your profile

### 🐛 Troubleshooting

**Expo Go crashes:**
- Some features require a development build
- Run `npx expo run:ios` instead

**Metro bundler issues:**
```bash
# Clear cache
npx expo start --clear
```

**Dependencies issues:**
```bash
# Clean install
rm -rf node_modules
npm install
```

### 🗄 Database Setup

The app uses Supabase PostgreSQL database with the following tables:
- `households` - Household information with captain tracking
- `members` - Family members and pets with gamification data
- `tasks` - Task management with categories and due dates
- `messages` - Family chat messages
- `rooms` - Household rooms
- `room_notes` - Notes for each room
- `captain_ratings` - Captain performance ratings
- `member_badges` - Earned badges

**Setup Instructions:**
1. Create a new Supabase project
2. Run migrations from `/Homie-docs/DATABASE_SCHEMA.md`
3. Enable Row Level Security policies
4. Configure authentication providers (Email, Google, Apple)

For detailed schema documentation, see `/Homie-docs/DATABASE_SCHEMA.md`.

### 📚 Additional Resources

1. **Documentation**
   - Database Schema: `/Homie-docs/DATABASE_SCHEMA.md`
   - API Reference: `/Homie-docs/API-REFERENCE.md`
   - Project Summary: `/Homie-docs/PROJECT_SUMMARY.md`

2. **Configure push notifications**
   - Set up Apple Push Notification service
   - Add certificates to Expo

3. **Set up subscriptions**
   - Configure RevenueCat products
   - Add in-app purchase items in App Store Connect

### 🤝 Support

For issues or questions:
- Email: hello@homie.app
- Documentation: `/Homie-docs/`

### 📄 License

Copyright © 2024 Homie App. All rights reserved.

---

**Happy Home Management! 🏠✨**