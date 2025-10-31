import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export function useDeepLinking() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL (when app is opened from a link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log('Deep link received:', url);

    try {
      const { hostname, path, queryParams } = ExpoLinking.parse(url);

      // Handle auth-related deep links
      if (hostname === 'auth' || path?.includes('auth')) {
        const accessToken = queryParams?.access_token as string;
        const refreshToken = queryParams?.refresh_token as string;
        const type = queryParams?.type as string;

        if (accessToken) {
          // Set the session in Supabase
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('Error setting session:', error);
            return;
          }

          console.log('Session set successfully:', data);

          // Route based on type
          if (type === 'recovery' || path?.includes('reset-password')) {
            // Password reset
            router.push('/(auth)/reset-password');
          } else if (type === 'signup' || type === 'invite') {
            // Email confirmation - redirect to onboarding or home
            router.replace('/(tabs)/');
          } else {
            // Default: go to home
            router.replace('/(tabs)/');
          }
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };
}
