import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { Colors } from '@/theme';
import { usePremiumStore } from '@/stores/premium.store';
import { AuthProvider } from '@/contexts/AuthContext';
import { HouseholdProvider } from '@/contexts/HouseholdContext';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeAnalytics } from '@/utils/analytics';
import { useNotifications } from '@/hooks/useNotifications';
import { useGenerateRecurringTaskInstances } from '@/hooks/useRecurringTasks';

// Initialize Sentry
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  enabled: !__DEV__, // Only enable in production
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
  debug: false, // Set to true for debugging
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

  const generateRecurringTasks = useGenerateRecurringTaskInstances();

  // Auto-generate recurring tasks on app start
  useEffect(() => {
    const timer = setTimeout(() => {
      generateRecurringTasks.mutate();
    }, 2000); // Wait 2 seconds after app starts

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: Colors.background,
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

  const [fontsLoaded] = useFonts({
    'CabinetGrotesk-Bold': require('@/assets/fonts/CabinetGrotesk-Bold.otf'),
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
  });

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
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <HouseholdProvider>
              <NavigationContent />
            </HouseholdProvider>
          </QueryClientProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// Wrap with Sentry for error tracking
export default Sentry.wrap(RootLayoutComponent);