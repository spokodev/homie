import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { usePremiumStore } from '@/stores/premium.store';
import { AuthProvider } from '@/contexts/AuthContext';
import { HouseholdProvider } from '@/contexts/HouseholdContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeAnalytics } from '@/utils/analytics';
import { useNotifications } from '@/hooks/useNotifications';
import { useGenerateRecurringTaskInstances } from '@/hooks/useRecurringTasks';
import { useDeepLinking } from '@/hooks/useDeepLinking';
import { startNotificationProcessor } from '@/services/notificationService';

// Initialize Sentry
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  enabled: true, // Enable in both development and production
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
  debug: __DEV__, // Enable debug logs in development
  environment: __DEV__ ? 'development' : 'production',
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000, // 30 seconds
});

// Initialize PostHog Analytics
initializeAnalytics();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      refetchOnMount: true,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

function NavigationContent() {
  useProtectedRoute(); // Protect routes based on auth state
  useNotifications(); // Initialize notification listeners
  useDeepLinking(); // Handle deep links for email verification and password reset
  const colors = useThemeColors();

  const generateRecurringTasks = useGenerateRecurringTaskInstances();

  // Auto-generate recurring tasks and start notification processor on app start
  useEffect(() => {
    const timer = setTimeout(() => {
      generateRecurringTasks.mutate();
    }, 2000); // Wait 2 seconds after app starts

    // Start notification processor
    const stopProcessor = startNotificationProcessor();

    return () => {
      clearTimeout(timer);
      stopProcessor();
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background.primary,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="(modals)/subscription"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(modals)/create-task"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(modals)/task-details"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(modals)/edit-task"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(modals)/edit-profile"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(modals)/settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(modals)/notifications"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(modals)/recurring-tasks"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(modals)/create-recurring-task"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}

function RootLayoutComponent() {
  const initializePremium = usePremiumStore((state) => state.initialize);

  // Using system fonts for now - custom fonts can be added later
  const [fontsLoaded] = useFonts({});

  useEffect(() => {
    // Initialize RevenueCat when app starts
    initializePremium().catch(console.error);
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <QueryClientProvider client={queryClient}>
                <HouseholdProvider>
                  <NavigationContent />
                </HouseholdProvider>
              </QueryClientProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Wrap with Sentry for error tracking
export default Sentry.wrap(RootLayoutComponent);