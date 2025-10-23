# HOMIE Design System

## Brand Identity

### Colors
```scss
// Primary Palette
$coral-red: #FF6B6B;      // Primary - Energy, friendship
$teal: #4ECDC4;           // Secondary - Trust, calm
$sunny-yellow: #FFD93D;   // Accent - Joy, rewards
$success-green: #6BCB77;  // Success states
$error-red: #EE5A6F;      // Error states
$warning-orange: #FFA502; // Warning states

// Neutral Palette
$gray-900: #2D3436;       // Primary text
$gray-700: #636E72;       // Secondary text
$gray-500: #B2BEC3;       // Disabled text
$gray-300: #DFE6E9;       // Borders
$gray-100: #F5F7FA;       // Backgrounds
$white: #FFFFFF;          // Surface

// Dark Mode (Premium)
$dark-bg: #1A1D2E;
$dark-surface: #2D3447;
$dark-text: #F5F7FA;
```

### Typography
```scss
// Font Families
$font-heading: 'Cabinet Grotesk', -apple-system, sans-serif;
$font-body: 'Inter', -apple-system, sans-serif;
$font-pixel: 'Press Start 2P', monospace; // For gamification

// Type Scale
$h1: 32px / 1.2 / 700;  // Screen titles
$h2: 24px / 1.3 / 600;  // Section headers
$h3: 20px / 1.4 / 600;  // Card titles
$body: 16px / 1.5 / 400; // Body text
$small: 14px / 1.4 / 400; // Secondary text
$tiny: 12px / 1.3 / 400;  // Captions

// Pixel Text (gamification)
$pixel-lg: 16px;
$pixel-md: 12px;
$pixel-sm: 10px;
```

### Spacing System
```scss
// 4px base unit
$space-xxs: 2px;
$space-xs: 4px;
$space-sm: 8px;
$space-md: 16px;
$space-lg: 24px;
$space-xl: 32px;
$space-xxl: 48px;
$space-xxxl: 64px;
```

### Border Radius
```scss
$radius-sm: 4px;   // Buttons, inputs
$radius-md: 8px;   // Cards
$radius-lg: 16px;  // Modals
$radius-xl: 24px;  // Sheets
$radius-round: 999px; // Pills, avatars
```

### Shadows
```scss
// iOS Style
$shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
$shadow-md: 0 4px 12px rgba(0,0,0,0.12);
$shadow-lg: 0 8px 24px rgba(0,0,0,0.16);
$shadow-xl: 0 16px 32px rgba(0,0,0,0.20);

// Elevation (Android)
$elevation-1: 2dp;
$elevation-2: 4dp;
$elevation-3: 8dp;
$elevation-4: 16dp;
```

## Components

### Button
```tsx
variants: 'primary' | 'secondary' | 'ghost' | 'danger'
sizes: 'small' | 'medium' | 'large'
states: 'default' | 'pressed' | 'disabled' | 'loading'

// Specs
height: sm(32px) md(44px) lg(56px)
padding: sm(12px) md(16px) lg(20px)
fontSize: sm(14px) md(16px) lg(18px)
borderRadius: 8px
```

### Card
```tsx
variants: 'flat' | 'elevated' | 'outlined'
padding: 16px
borderRadius: 12px
background: white
shadow: elevated ? shadow-md : none
border: outlined ? 1px solid gray-300 : none
```

### Input
```tsx
height: 48px
padding: 12px 16px
fontSize: 16px
borderRadius: 8px
border: 1px solid gray-300
focus: borderColor = primary
error: borderColor = error-red
```

### Avatar
```tsx
sizes: 'xs'(24) | 'sm'(32) | 'md'(48) | 'lg'(64) | 'xl'(96)
borderRadius: 50%
border: 2px solid white
shadow: shadow-sm
```

### Badge
```tsx
height: 20px
padding: 2px 8px
fontSize: 12px
borderRadius: 10px
background: coral-red
color: white
minWidth: 20px
```

## Animations

### Timing
```js
$duration-instant: 100ms;
$duration-fast: 200ms;
$duration-normal: 300ms;
$duration-slow: 400ms;
$duration-slower: 600ms;

$easing-default: cubic-bezier(0.4, 0, 0.2, 1);
$easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
$easing-accelerate: cubic-bezier(0.4, 0, 1, 1);
$easing-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Haptic Feedback
- Light: selection, toggle
- Medium: task complete, button press
- Heavy: achievement unlock, level up
- Success: rating submitted
- Warning: delete action
- Error: validation fail

## Mascot Design

### Homie the Helper
- Friendly dog character
- Brown fur (#8B6F47)
- Coral red bandana/apron
- Expressive eyes
- Pixel art style (32x32 base)

### Emotional States
- Idle: slight tail wag
- Happy: jumping, stars around
- Celebrating: confetti, arms up
- Encouraging: thumbs up
- Sleeping: z's floating
- Working: holding mop/broom