import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  // UI State
  isOnboarded: boolean;
  hasSeenWelcome: boolean;
  theme: 'light' | 'dark' | 'system';

  // Notifications
  notificationsEnabled: boolean;
  pushToken?: string;

  // App Version
  lastAppVersion?: string;

  // Actions
  setOnboarded: (value: boolean) => void;
  setHasSeenWelcome: (value: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setPushToken: (token: string) => void;
  setLastAppVersion: (version: string) => void;
  reset: () => void;
}

const initialState = {
  isOnboarded: false,
  hasSeenWelcome: false,
  theme: 'system' as const,
  notificationsEnabled: false,
  pushToken: undefined,
  lastAppVersion: undefined,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setOnboarded: (value: boolean) => set({ isOnboarded: value }),
      setHasSeenWelcome: (value: boolean) => set({ hasSeenWelcome: value }),
      setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
      setNotificationsEnabled: (enabled: boolean) =>
        set({ notificationsEnabled: enabled }),
      setPushToken: (token: string) => set({ pushToken: token }),
      setLastAppVersion: (version: string) => set({ lastAppVersion: version }),
      reset: () => set(initialState),
    }),
    {
      name: 'app-storage',
      storage: AsyncStorage as any,
    }
  )
);
