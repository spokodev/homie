import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { trackScreenLoad } from '@/utils/performance';
import { trackScreenView } from '@/utils/analytics';

/**
 * Hook to track screen navigation performance
 * Automatically tracks screen load time and analytics
 */
export function useNavigationPerformance(screenName?: string) {
  const pathname = usePathname();
  const trackerRef = useRef<{ finish: () => void } | null>(null);

  useEffect(() => {
    const name = screenName || pathname;

    // Start performance tracking
    trackerRef.current = trackScreenLoad(name);

    // Track screen view in analytics
    trackScreenView(name);

    // Finish tracking on unmount
    return () => {
      if (trackerRef.current) {
        trackerRef.current.finish();
      }
    };
  }, [pathname, screenName]);
}
