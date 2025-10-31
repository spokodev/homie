// Legacy Colors export for backward compatibility
// These flat color constants are used by older components that haven't been migrated to the new theme system
export const Colors = {
  // Brand colors
  primary: '#FF5757',     // Coral Red (updated modern version)
  secondary: '#319795',   // Teal
  accent: '#F59E0B',      // Yellow
  success: '#22C55E',     // Green
  error: '#EF4444',       // Red
  warning: '#F59E0B',     // Orange

  // Gray scale
  gray950: '#09090B',     // Darkest
  gray900: '#18181B',     // Very Dark
  gray800: '#27272A',     // Dark
  gray700: '#3F3F46',     // Medium Dark
  gray600: '#52525B',     // Medium
  gray500: '#71717A',     // Medium Light
  gray400: '#A1A1AA',     // Light Medium
  gray300: '#D4D4D8',     // Light
  gray200: '#E4E4E7',     // Very Light
  gray100: '#F4F4F5',     // Extra Light
  gray50: '#FAFAFA',      // Almost White
  white: '#FFFFFF',       // Pure White
  black: '#000000',       // Pure Black

  // Background colors
  background: '#FAFAF9',  // Primary background
  backgroundSecondary: '#FAFAFA', // Secondary background
  surface: '#FFFFFF',     // Card/surface background
  card: '#FFFFFF',        // Card background (alias for surface)

  // Text colors
  text: '#18181B',        // Primary text (gray900)
  textSecondary: '#52525B', // Secondary text (gray600)
  textTertiary: '#71717A', // Tertiary text (gray500)
  textDisabled: '#A1A1AA', // Disabled text (gray400)

  // Border colors
  border: '#E4E4E7',      // Default border (gray200)
  borderHover: '#D4D4D8', // Hover border (gray300)
  borderFocus: '#FF5757', // Focus border (primary)

  // Semantic colors
  captain: '#FF5757',     // Captain badge (primary)
  pet: '#8B6F47',         // Pet brown
  streak: '#F59E0B',      // Streak orange (accent)

  // Additional semantic colors for legacy code
  info: '#319795',        // Info color (secondary)
  link: '#FF5757',        // Link color (primary)

  // Transparent
  transparent: 'transparent',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Typography = {
  // Headers - Cabinet Grotesk
  h1: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  h5: {
    fontFamily: 'CabinetGrotesk-Bold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },

  // Body - Inter
  bodyLarge: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },

  // Labels
  labelLarge: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.1,
  },

  // Buttons
  button: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
} as const;

export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 20,
  full: 999,
} as const;

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4.0,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6.0,
    elevation: 4,
  },
} as const;

// Helper function to create card style with borders for better visibility
export const createCardStyle = (borderColor: string = Colors.border) => ({
  borderWidth: 1,
  borderColor,
  ...Shadows.small,
});

export const Animations = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
  },
} as const;

// Re-export color types from colors.ts for convenience
export type { FlattenedColors } from './colors';

export default {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  Animations,
};