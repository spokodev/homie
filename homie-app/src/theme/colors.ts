// Semantic Color System with Dark Mode Support

export type ColorScheme = 'light' | 'dark';

// Base color palette
const palette = {
  // Updated modern colors for 2024
  coral: {
    50: '#FFF5F5',
    100: '#FFE8E8',
    200: '#FFD1D1',
    300: '#FFB3B3',
    400: '#FF8A8A',
    500: '#FF5757', // Updated primary - more modern
    600: '#E64545',
    700: '#CC3333',
    800: '#B32424',
    900: '#991919',
  },
  teal: {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#319795',
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
  },
  yellow: {
    50: '#FFFBEA',
    100: '#FFF3C4',
    200: '#FFEA8A',
    300: '#FFD748',
    400: '#FFC020',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  gray: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },
  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Semantic color tokens
export const lightColors = {
  // Backgrounds
  background: {
    primary: '#FAFAF9', // Updated from cream to more neutral
    secondary: palette.gray[50],
    tertiary: palette.gray[100],
    inverse: palette.gray[900],
  },

  // Surfaces (cards, modals, etc)
  surface: {
    primary: palette.white,
    secondary: palette.gray[50],
    tertiary: palette.gray[100],
    elevated: palette.white, // For elevated surfaces
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  text: {
    primary: palette.gray[900],
    secondary: palette.gray[600],
    tertiary: palette.gray[500],
    disabled: palette.gray[400],
    inverse: palette.white,
    link: palette.coral[500],
    error: palette.red[600],
    success: palette.green[600],
    warning: palette.yellow[600],
  },

  // Brand colors
  primary: {
    default: palette.coral[500],
    hover: palette.coral[600],
    pressed: palette.coral[700],
    disabled: palette.coral[300],
    subtle: palette.coral[50],
    text: palette.white,
  },

  secondary: {
    default: palette.teal[500],
    hover: palette.teal[600],
    pressed: palette.teal[700],
    disabled: palette.teal[300],
    subtle: palette.teal[50],
    text: palette.white,
  },

  accent: {
    default: palette.yellow[500],
    hover: palette.yellow[600],
    pressed: palette.yellow[700],
    disabled: palette.yellow[300],
    subtle: palette.yellow[50],
    text: palette.gray[900],
  },

  // Semantic colors
  success: {
    default: palette.green[500],
    hover: palette.green[600],
    pressed: palette.green[700],
    subtle: palette.green[50],
    text: palette.white,
  },

  error: {
    default: palette.red[500],
    hover: palette.red[600],
    pressed: palette.red[700],
    subtle: palette.red[50],
    text: palette.white,
  },

  warning: {
    default: palette.yellow[500],
    hover: palette.yellow[600],
    pressed: palette.yellow[700],
    subtle: palette.yellow[50],
    text: palette.gray[900],
  },

  info: {
    default: palette.teal[500],
    hover: palette.teal[600],
    pressed: palette.teal[700],
    subtle: palette.teal[50],
    text: palette.white,
  },

  // Borders
  border: {
    default: palette.gray[200],
    hover: palette.gray[300],
    focus: palette.coral[500],
    disabled: palette.gray[100],
    error: palette.red[500],
  },

  // Special use cases
  captain: palette.coral[500],
  pet: '#8B6F47',
  streak: palette.yellow[500],

  // Shadows (for reference in components)
  shadow: {
    small: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.10)',
    large: 'rgba(0, 0, 0, 0.15)',
  },

  // Flat color properties for backward compatibility with legacy code
  // These allow components to use colors.card instead of colors.surface.primary
  card: palette.white,
  textSecondary: palette.gray[600],
  gray50: palette.gray[50],
  gray100: palette.gray[100],
  gray200: palette.gray[200],
  gray300: palette.gray[300],
  gray400: palette.gray[400],
  gray500: palette.gray[500],
  gray600: palette.gray[600],
  gray700: palette.gray[700],
  gray800: palette.gray[800],
  gray900: palette.gray[900],
  gray950: palette.gray[950],
};

// Dark mode colors
export const darkColors = {
  // Backgrounds
  background: {
    primary: palette.gray[950],
    secondary: palette.gray[900],
    tertiary: palette.gray[800],
    inverse: palette.gray[50],
  },

  // Surfaces (cards, modals, etc)
  surface: {
    primary: palette.gray[900],
    secondary: palette.gray[800],
    tertiary: palette.gray[700],
    elevated: palette.gray[800],
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Text colors
  text: {
    primary: palette.gray[50],
    secondary: palette.gray[300],
    tertiary: palette.gray[400],
    disabled: palette.gray[600],
    inverse: palette.gray[900],
    link: palette.coral[400],
    error: palette.red[400],
    success: palette.green[400],
    warning: palette.yellow[400],
  },

  // Brand colors (adjusted for dark mode)
  primary: {
    default: palette.coral[400],
    hover: palette.coral[300],
    pressed: palette.coral[500],
    disabled: palette.coral[700],
    subtle: `${palette.coral[500]}15`, // 15% opacity
    text: palette.gray[900],
  },

  secondary: {
    default: palette.teal[400],
    hover: palette.teal[300],
    pressed: palette.teal[500],
    disabled: palette.teal[700],
    subtle: `${palette.teal[500]}15`,
    text: palette.gray[900],
  },

  accent: {
    default: palette.yellow[400],
    hover: palette.yellow[300],
    pressed: palette.yellow[500],
    disabled: palette.yellow[700],
    subtle: `${palette.yellow[500]}15`,
    text: palette.gray[900],
  },

  // Semantic colors (adjusted for dark mode)
  success: {
    default: palette.green[400],
    hover: palette.green[300],
    pressed: palette.green[500],
    subtle: `${palette.green[500]}15`,
    text: palette.gray[900],
  },

  error: {
    default: palette.red[400],
    hover: palette.red[300],
    pressed: palette.red[500],
    subtle: `${palette.red[500]}15`,
    text: palette.gray[900],
  },

  warning: {
    default: palette.yellow[400],
    hover: palette.yellow[300],
    pressed: palette.yellow[500],
    subtle: `${palette.yellow[500]}15`,
    text: palette.gray[900],
  },

  info: {
    default: palette.teal[400],
    hover: palette.teal[300],
    pressed: palette.teal[500],
    subtle: `${palette.teal[500]}15`,
    text: palette.gray[900],
  },

  // Borders
  border: {
    default: palette.gray[700],
    hover: palette.gray[600],
    focus: palette.coral[400],
    disabled: palette.gray[800],
    error: palette.red[400],
  },

  // Special use cases
  captain: palette.coral[400],
  pet: '#A68B6B',
  streak: palette.yellow[400],

  // Shadows (less visible in dark mode)
  shadow: {
    small: 'rgba(0, 0, 0, 0.2)',
    medium: 'rgba(0, 0, 0, 0.3)',
    large: 'rgba(0, 0, 0, 0.4)',
  },

  // Flat color properties for backward compatibility with legacy code
  card: palette.gray[900],
  textSecondary: palette.gray[300],
  gray50: palette.gray[50],
  gray100: palette.gray[100],
  gray200: palette.gray[200],
  gray300: palette.gray[300],
  gray400: palette.gray[400],
  gray500: palette.gray[500],
  gray600: palette.gray[600],
  gray700: palette.gray[700],
  gray800: palette.gray[800],
  gray900: palette.gray[900],
  gray950: palette.gray[950],
};

// Type for theme colors (original nested structure)
export type ThemeColors = typeof lightColors;

// Type for flattened colors (what useThemeColors() actually returns)
export interface FlattenedColors {
  // Simple color values (already flat)
  captain: string;
  pet: string;
  streak: string;
  card: string;
  textSecondary: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
  gray950: string;

  // Flattened semantic colors (default values extracted)
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  info: string;

  // Flattened nested objects (primary/default values)
  background: string;
  surface: string;
  text: string;
  border: string;

  // Shadow remains as object
  shadow: {
    small: string;
    medium: string;
    large: string;
  };
}

// Helper function to get colors based on theme
export const getColors = (colorScheme: ColorScheme): ThemeColors => {
  return colorScheme === 'dark' ? darkColors : lightColors;
};

// Export palette for custom use cases
export { palette };