// HOMIE App Constants - Updated Version

export const APP_CONFIG = {
  // App Identity
  name: 'Homie',
  displayName: 'Homie',
  tagline: 'Make home management fun',
  description: 'Transform household chores into a joyful family game',
  
  // URLs
  website: 'https://homie.app',
  websiteDisplay: 'homie.app',
  
  // Contact
  supportEmail: 'hello@homie.app',
  feedbackEmail: 'feedback@homie.app',
  
  // Legal
  privacyPolicyUrl: 'https://homie.app/privacy',
  termsOfServiceUrl: 'https://homie.app/terms',
  
  // Pricing
  pricing: {
    premium: {
      monthly: 4.99,
      currency: 'USD',
      id: 'premium_monthly'
    }
  },
  
  // Colors
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFD93D',
    success: '#6BCB77',
    error: '#EE5A6F',
    warning: '#FFA502',
    gray900: '#2D3436',
    gray700: '#636E72',
    gray500: '#B2BEC3',
    gray300: '#DFE6E9',
    gray100: '#F5F7FA',
    white: '#FFFFFF'
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

// Task Templates
export const TASK_TEMPLATES = [
  { title: 'Quick Clean', icon: '🧹', minutes: 15, points: 20 },
  { title: 'Do Dishes', icon: '🍽️', minutes: 20, points: 15 },
  { title: 'Take Out Trash', icon: '🗑️', minutes: 5, points: 10 },
  { title: 'Walk Dog', icon: '🐕', minutes: 30, points: 25 },
  { title: 'Laundry', icon: '🧺', minutes: 45, points: 30 },
  { title: 'Vacuum', icon: '🔌', minutes: 25, points: 25 },
  { title: 'Bathroom Clean', icon: '🚿', minutes: 30, points: 35 },
  { title: 'Kitchen Deep Clean', icon: '🍳', minutes: 45, points: 40 }
];

// Room Presets
export const ROOM_PRESETS = [
  { name: 'Living Room', icon: '🛋️' },
  { name: 'Kitchen', icon: '🍳' },
  { name: 'Bedroom', icon: '🛏️' },
  { name: 'Bathroom', icon: '🚿' },
  { name: 'Office', icon: '💻' },
  { name: 'Garage', icon: '🚗' },
  { name: 'Garden', icon: '🌱' },
  { name: 'Pet Zone', icon: '🐾' }
];

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
};

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
};

// Notification Templates
export const NOTIFICATIONS = {
  taskAssigned: (task: string) => `New task: "${task}"`,
  taskDue: (task: string, hours: number) => `"${task}" due in ${hours}h`,
  ratingReminder: (name: string) => `Time to rate ${name}'s week!`,
  captainAssigned: (name: string) => `${name} is this week's Captain!`,
  levelUp: (level: number) => `Level ${level} unlocked! 🎉`,
  streakMilestone: (days: number) => `${days} day streak! 🔥`
};

// Animation Durations
export const ANIMATION = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150
  }
};

// Error Messages
export const ERRORS = {
  network: 'No internet connection',
  server: 'Something went wrong',
  auth: {
    invalidCredentials: 'Invalid email or password',
    emailInUse: 'Email already registered',
    weakPassword: 'Password must be 8+ characters'
  },
  validation: {
    required: (field: string) => `${field} is required`,
    tooLong: (field: string, max: number) => `${field} max ${max} characters`
  }
};

// Success Messages  
export const SUCCESS = {
  taskCompleted: 'Great job! Task completed! ⭐',
  ratingSubmitted: 'Thanks for your feedback! ⭐',
  levelUp: (level: number) => `Level ${level} reached! 🎉`,
  badgeUnlocked: (badge: string) => `"${badge}" badge unlocked! 🏆`
};