import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';

/**
 * Custom hook to protect routes and redirect based on auth state
 * Automatically redirects:
 * - Unauthenticated users trying to access protected routes -> to /
 * - Authenticated users on auth routes -> to /(tabs)/home or onboarding
 * - Authenticated users without household -> to onboarding
 */
export function useProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const { household, loading: householdLoading } = useHousehold();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || householdLoading) return; // Don't redirect while checking state

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments.includes('onboarding');

    if (!user && inTabsGroup) {
      // User not logged in but trying to access protected tabs
      router.replace('/');
    } else if (user && !household && !inOnboarding) {
      // User logged in but has no household - needs onboarding
      router.replace('/(auth)/onboarding');
    } else if (user && household && (inAuthGroup || segments.length === 0)) {
      // User logged in with household but on auth routes or welcome screen
      router.replace('/(tabs)/home');
    }
  }, [user, household, segments, authLoading, householdLoading]);
}
