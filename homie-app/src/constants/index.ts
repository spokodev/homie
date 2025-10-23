export const APP_CONFIG = {
  // App Identity
  name: 'HomieLife',
  displayName: 'HomieLife',
  tagline: 'Make home management fun',
  description: 'Transform household chores into a joyful family game',

  // URLs
  website: 'https://tryhomie.app',
  websiteDisplay: 'tryhomie.app',

  // Contact
  supportEmail: 'hello@tryhomie.app',
  feedbackEmail: 'feedback@tryhomie.app',

  // Legal
  privacyPolicyUrl: 'https://tryhomie.app/privacy',
  termsOfServiceUrl: 'https://tryhomie.app/terms',

  // Pricing
  pricing: {
    premium: {
      monthly: 4.99,
      yearly: 49.99,
      currency: 'USD',
      monthlyId: 'premium_monthly',
      yearlyId: 'premium_yearly',
      savings: 10, // $10 saved yearly
    }
  },

  // Gamification
  game: {
    pointsPerLevel: 100,
    maxFreeLevel: 20,
    maxPremiumLevel: 50,
    captainRatingMultiplier: 20,
    streakBonus: 5,
    speedBonusPercent: 30
  },

  // Limits
  limits: {
    free: {
      households: 1,
      members: 5,
      notesPerRoom: 3,
      badges: 5,
      maxLevel: 20
    },
    premium: {
      households: 1,
      members: 'unlimited',
      notesPerRoom: 'unlimited',
      badges: 20,
      maxLevel: 50
    }
  }
} as const;

// Task Categories
export const TASK_CATEGORIES = [
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', color: '#10B981' },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳', color: '#F59E0B' },
  { id: 'bathroom', name: 'Bathroom', icon: '🚿', color: '#3B82F6' },
  { id: 'pet', name: 'Pet Care', icon: '🐕', color: '#8B5CF6' },
  { id: 'laundry', name: 'Laundry', icon: '🧺', color: '#EC4899' },
  { id: 'outdoor', name: 'Outdoor', icon: '🌱', color: '#14B8A6' },
  { id: 'maintenance', name: 'Maintenance', icon: '🔧', color: '#6B7280' },
  { id: 'shopping', name: 'Shopping', icon: '🛒', color: '#EF4444' },
  { id: 'general', name: 'General', icon: '📋', color: '#6366F1' },
] as const;

export type TaskCategoryId = typeof TASK_CATEGORIES[number]['id'];

// Task Templates
export const TASK_TEMPLATES = [
  { id: '1', title: 'Quick Clean', icon: '🧹', minutes: 15, points: 20, category: 'cleaning' },
  { id: '2', title: 'Do Dishes', icon: '🍽️', minutes: 20, points: 15, category: 'kitchen' },
  { id: '3', title: 'Take Out Trash', icon: '🗑️', minutes: 5, points: 10, category: 'general' },
  { id: '4', title: 'Walk Dog', icon: '🐕', minutes: 30, points: 25, category: 'pet' },
  { id: '5', title: 'Laundry', icon: '🧺', minutes: 45, points: 30, category: 'laundry' },
  { id: '6', title: 'Vacuum', icon: '🔌', minutes: 25, points: 25, category: 'cleaning' },
  { id: '7', title: 'Bathroom Clean', icon: '🚿', minutes: 30, points: 35, category: 'bathroom' },
  { id: '8', title: 'Kitchen Deep Clean', icon: '🍳', minutes: 45, points: 40, category: 'kitchen' }
] as const;

// Room Presets
export const ROOM_PRESETS = [
  { id: '1', name: 'Living Room', icon: '🛋️' },
  { id: '2', name: 'Kitchen', icon: '🍳' },
  { id: '3', name: 'Bedroom', icon: '🛏️' },
  { id: '4', name: 'Bathroom', icon: '🚿' },
  { id: '5', name: 'Office', icon: '💻' },
  { id: '6', name: 'Garage', icon: '🚗' },
  { id: '7', name: 'Garden', icon: '🌱' },
  { id: '8', name: 'Pet Zone', icon: '🐾' }
] as const;

// Common Icons for Rooms/Items
export const COMMON_ICONS = [
  '🏠', '🛋️', '🍳', '🛏️', '🚿', '💻', '🚗', '🌱',
  '📚', '🎮', '🎵', '🎨', '⚽', '🏃', '🧘', '🍕',
  '☕', '🎬', '📱', '💡', '🔧', '🧼', '🧺', '🗑️'
] as const;

// Common Avatars for People
export const COMMON_AVATARS = [
  '👨', '👩', '👦', '👧', '👴', '👵',
  '👶', '🧔', '👱‍♀️', '👱‍♂️', '🧑', '👨‍🦰',
  '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦲', '👩‍🦲', '👨‍🦳',
  '👩‍🦳', '🧓', '😊', '🙂', '😃', '🥰'
] as const;

// Pet Avatars
export const PET_AVATARS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊',
  '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
  '🐷', '🐸', '🐵', '🐔', '🐧', '🐦',
  '🦆', '🦅', '🦉', '🦇', '🐺', '🐗'
] as const;

// Badges Configuration
export const BADGES = {
  free: [
    { id: 'first_task', name: 'First Task', icon: '🌟', description: 'Complete your first task' },
    { id: 'week_streak', name: 'Week Warrior', icon: '🔥', description: '7 day streak' },
    { id: 'home_hero', name: 'Home Hero', icon: '🏠', description: 'Complete 10 tasks' },
    { id: 'pet_pal', name: 'Pet Pal', icon: '🐕', description: 'Complete 5 pet tasks' },
    { id: 'five_star', name: '5-Star Captain', icon: '⭐', description: 'Get 5-star rating' }
  ],
  premium: [
    { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', description: 'Beat estimate 10 times' },
    { id: 'perfectionist', name: 'Perfectionist', icon: '💎', description: '10 perfect ratings' },
    { id: 'early_bird', name: 'Early Bird', icon: '🐦', description: 'Complete before 9am' },
    { id: 'night_owl', name: 'Night Owl', icon: '🦉', description: 'Complete after 10pm' },
    { id: 'marathon', name: 'Marathon Runner', icon: '🏃', description: '50 tasks completed' },
    { id: 'legendary', name: 'Legendary', icon: '👑', description: 'Reach level 50' },
    { id: 'team_player', name: 'Team Player', icon: '🤝', description: 'Help others 20 times' },
    { id: 'organizer', name: 'Master Organizer', icon: '📋', description: 'Create 100 tasks' },
    { id: 'consistent', name: 'Consistency King', icon: '📅', description: '30 day streak' },
    { id: 'communicator', name: 'Great Communicator', icon: '💬', description: '100 chat messages' },
    { id: 'note_taker', name: 'Note Master', icon: '📝', description: '50 notes created' },
    { id: 'pet_hero', name: 'Pet Hero', icon: '🦸', description: '100 pet tasks done' },
    { id: 'cleaning_guru', name: 'Cleaning Guru', icon: '✨', description: 'Perfect captain 5 times' },
    { id: 'motivator', name: 'Motivator', icon: '📣', description: 'Give 50 positive ratings' },
    { id: 'unstoppable', name: 'Unstoppable', icon: '🚀', description: '100 day total activity' }
  ]
} as const;

// Rating Feedback Options
export const RATING_OPTIONS = {
  positive: [
    'Always on time',
    'Great communication',
    'Went above and beyond',
    'Very organized',
    'Kept everything clean',
    'Great with pets',
    'Helpful to others',
    'Positive attitude'
  ],
  improvement: [
    'Could be more timely',
    'Needs better planning',
    'More attention to detail',
    'Communicate updates',
    'Delegate more tasks',
    'Check completion quality',
    'Follow up on issues',
    'Be more proactive'
  ]
} as const;

// Error Messages
export const ERRORS = {
  network: 'No internet connection',
  server: 'Something went wrong. Please try again.',
  auth: {
    invalidCredentials: 'Invalid email or password',
    emailInUse: 'Email already registered',
    weakPassword: 'Password must be at least 8 characters'
  },
  validation: {
    required: (field: string) => `${field} is required`,
    tooLong: (field: string, max: number) => `${field} max ${max} characters`,
    invalidEmail: 'Please enter a valid email',
  }
} as const;

// Success Messages
export const SUCCESS = {
  taskCompleted: 'Great job! Task completed! ⭐',
  ratingSubmitted: 'Thanks for your feedback! ⭐',
  levelUp: (level: number) => `Level ${level} reached! 🎉`,
  badgeUnlocked: (badge: string) => `"${badge}" badge unlocked! 🏆`
} as const;