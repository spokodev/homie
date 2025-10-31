import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorScheme, ThemeColors, FlattenedColors, getColors } from '@/theme/colors';

interface ThemeContextType {
  colorScheme: ColorScheme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ColorScheme) => void;
  isSystemTheme: boolean;
  setIsSystemTheme: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@HomieLife:theme';
const SYSTEM_THEME_KEY = '@HomieLife:useSystemTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme() ?? 'light';
  const [colorScheme, setColorScheme] = useState<ColorScheme>(systemColorScheme);
  const [isSystemTheme, setIsSystemTheme] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const [savedTheme, savedSystemPref] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(SYSTEM_THEME_KEY),
        ]);

        const useSystem = savedSystemPref === null || savedSystemPref === 'true';
        setIsSystemTheme(useSystem);

        if (!useSystem && savedTheme) {
          setColorScheme(savedTheme as ColorScheme);
        } else {
          setColorScheme(systemColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // Default to system theme on error
        setColorScheme(systemColorScheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Update theme when system theme changes (if using system theme)
  useEffect(() => {
    if (isSystemTheme && !isLoading) {
      setColorScheme(systemColorScheme);
    }
  }, [systemColorScheme, isSystemTheme, isLoading]);

  // Save theme preference
  const saveThemePreference = async (theme: ColorScheme, useSystem: boolean) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(THEME_STORAGE_KEY, theme),
        AsyncStorage.setItem(SYSTEM_THEME_KEY, String(useSystem)),
      ]);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newTheme);
    setIsSystemTheme(false);
    saveThemePreference(newTheme, false);
  };

  const setTheme = (theme: ColorScheme) => {
    setColorScheme(theme);
    setIsSystemTheme(false);
    saveThemePreference(theme, false);
  };

  const handleSetIsSystemTheme = (value: boolean) => {
    setIsSystemTheme(value);
    if (value) {
      setColorScheme(systemColorScheme);
      saveThemePreference(systemColorScheme, true);
    } else {
      saveThemePreference(colorScheme, false);
    }
  };

  const colors = getColors(colorScheme);

  const value = {
    colorScheme,
    colors,
    toggleTheme,
    setTheme,
    isSystemTheme,
    setIsSystemTheme: handleSetIsSystemTheme,
  };

  // Don't render children until theme is loaded to avoid flash
  if (isLoading) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper to flatten nested color objects for backward compatibility
// Converts { default: '#FF5757', hover: '#E64545', ... } to just '#FF5757'
function flattenColors(colors: ThemeColors): FlattenedColors {
  const flattened: any = {};

  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'object' && value !== null) {
      if ('default' in value) {
        // For nested objects with 'default' key (primary, secondary, etc.), use the default value
        flattened[key] = (value as any).default;
      } else if ('primary' in value || 'default' in value) {
        // For nested objects like background, text, border, surface - use the first/primary value
        const objValue = value as any;
        flattened[key] = objValue.primary || objValue.default || Object.values(objValue)[0];
      } else {
        // Keep nested objects as is (like shadow)
        flattened[key] = value;
      }
    } else {
      // For primitive values, keep as is
      flattened[key] = value;
    }
  }

  return flattened as FlattenedColors;
}

// Helper hook to get just the colors (with flattened semantic colors for backward compatibility)
export function useThemeColors(): FlattenedColors {
  const { colors } = useTheme();
  return flattenColors(colors);
}