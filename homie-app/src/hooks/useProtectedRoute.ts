import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook to protect routes and redirect based on auth state
 * Automatically redirects:
 * - Unauthenticated users trying to access protected routes -> to /
 * - Authenticated users on auth routes -> to /(tabs)/home
 */
export function useProtectedRoute() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't redirect while checking auth state

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && inTabsGroup) {
      // User not logged in but trying to access protected tabs
      router.replace('/');
    } else if (user && (inAuthGroup || segments.length === 0)) {
      // User logged in but on auth routes or welcome screen
      router.replace('/(tabs)/home');
    }
  }, [user, segments, loading]);
}
