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
│   ├── (tabs)/          # Main app tabs
│   └── _layout.tsx      # Root layout
├── src/
│   ├── components/      # Reusable UI components
│   ├── features/        # Feature modules
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Libraries (Supabase, etc.)
│   ├── stores/         # Zustand state stores
│   ├── theme/          # Design system
│   ├── types/          # TypeScript types
│   └── constants/      # App constants
├── assets/             # Images, fonts
└── app.json           # Expo configuration
```

### 🛠 Available Scripts

```bash
# Start development server
npm start

# Run on iOS Simulator
npm run ios

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

### 🧪 Testing the App

1. **Welcome Flow**
   - Open app → See welcome screen
   - Tap "Get Started" → Sign up screen
   - Create account → Onboarding

2. **Main Features**
   - Home dashboard with captain card
   - Task management
   - Family chat
   - Leaderboard
   - Profile

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

### 📚 Next Steps

1. **Set up Supabase database**
   - Run migrations from `Homie-docs/HOMIE-DATABASE-SCHEMA.sql`
   - Enable Row Level Security
   - Configure authentication

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