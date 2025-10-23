export const Colors = {
  primary: '#FF6B6B',     // Coral Red
  secondary: '#4ECDC4',   // Teal
  accent: '#FFD93D',      // Yellow
  success: '#6BCB77',     // Green
  error: '#EE5A6F',       // Error Red
  warning: '#FFA502',     // Orange

  gray900: '#2D3436',     // Dark Gray
  gray700: '#636E72',     // Medium Gray
  gray500: '#B2BEC3',     // Light Gray
  gray300: '#DFE6E9',     // Very Light Gray
  gray100: '#F5F7FA',     // Almost White
  white: '#FFFFFF',       // Pure White

  background: '#FFF8F0',  // Cream background
  surface: '#FFFFFF',     // Card background
  text: '#2D3436',        // Primary text
  textSecondary: '#636E72', // Secondary text

  // Semantic colors
  captain: '#FF6B6B',     // Captain badge
  pet: '#8B6F47',        // Pet brown
  streak: '#FFA502',     // Streak orange
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
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
} as const;

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

export default {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  Animations,
};