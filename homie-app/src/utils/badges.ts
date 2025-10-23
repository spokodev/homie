import { BADGES } from '@/constants';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  tier: 'free' | 'premium';
}

export interface BadgeCriteria {
  tasksCompleted?: number;
  streakDays?: number;
  level?: number;
  petTasksCompleted?: number;
  speedWins?: number;
  perfectRatings?: number;
  totalActivity?: number;
  notesCreated?: number;
  messagesCount?: number;
  tasksCreated?: number;
  helpedOthers?: number;
  positiveRatings?: number;
  captainPerfectRatings?: number;
  completeBefore?: string; // e.g., '09:00'
  completeAfter?: string; // e.g., '22:00'
}

/**
 * Get all badges (free + premium based on user tier)
 */
export function getAllBadges(isPremium: boolean = false): Badge[] {
  const freeBadges = BADGES.free.map(b => ({ ...b, tier: 'free' as const }));

  if (!isPremium) {
    return freeBadges;
  }

  const premiumBadges = BADGES.premium.map(b => ({ ...b, tier: 'premium' as const }));
  return [...freeBadges, ...premiumBadges];
}

/**
 * Check if badge criteria is met
 */
export function checkBadgeCriteria(
  badgeId: string,
  memberStats: BadgeCriteria
): boolean {
  switch (badgeId) {
    // Free badges
    case 'first_task':
      return (memberStats.tasksCompleted || 0) >= 1;

    case 'week_streak':
      return (memberStats.streakDays || 0) >= 7;

    case 'home_hero':
      return (memberStats.tasksCompleted || 0) >= 10;

    case 'pet_pal':
      return (memberStats.petTasksCompleted || 0) >= 5;

    case 'five_star':
      return (memberStats.perfectRatings || 0) >= 1;

    // Premium badges
    case 'speed_demon':
      return (memberStats.speedWins || 0) >= 10;

    case 'perfectionist':
      return (memberStats.perfectRatings || 0) >= 10;

    case 'early_bird':
      return checkTimeBasedTask(memberStats, 'before', '09:00');

    case 'night_owl':
      return checkTimeBasedTask(memberStats, 'after', '22:00');

    case 'marathon':
      return (memberStats.tasksCompleted || 0) >= 50;

    case 'legendary':
      return (memberStats.level || 0) >= 50;

    case 'team_player':
      return (memberStats.helpedOthers || 0) >= 20;

    case 'organizer':
      return (memberStats.tasksCreated || 0) >= 100;

    case 'consistent':
      return (memberStats.streakDays || 0) >= 30;

    case 'communicator':
      return (memberStats.messagesCount || 0) >= 100;

    case 'note_taker':
      return (memberStats.notesCreated || 0) >= 50;

    case 'pet_hero':
      return (memberStats.petTasksCompleted || 0) >= 100;

    case 'cleaning_guru':
      return (memberStats.captainPerfectRatings || 0) >= 5;

    case 'motivator':
      return (memberStats.positiveRatings || 0) >= 50;

    case 'unstoppable':
      return (memberStats.totalActivity || 0) >= 100;

    default:
      return false;
  }
}

/**
 * Helper for time-based badge checks
 */
function checkTimeBasedTask(
  memberStats: BadgeCriteria,
  type: 'before' | 'after',
  time: string
): boolean {
  if (type === 'before' && memberStats.completeBefore) {
    return memberStats.completeBefore <= time;
  }
  if (type === 'after' && memberStats.completeAfter) {
    return memberStats.completeAfter >= time;
  }
  return false;
}

/**
 * Check multiple badges and return newly earned ones
 */
export function checkNewBadges(
  memberStats: BadgeCriteria,
  earnedBadgeIds: string[],
  isPremium: boolean = false
): Badge[] {
  const allBadges = getAllBadges(isPremium);
  const newBadges: Badge[] = [];

  for (const badge of allBadges) {
    // Skip if already earned
    if (earnedBadgeIds.includes(badge.id)) continue;

    // Check if criteria met
    if (checkBadgeCriteria(badge.id, memberStats)) {
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Get badge by ID
 */
export function getBadgeById(badgeId: string): Badge | null {
  const allBadges = getAllBadges(true); // Get all badges including premium
  return allBadges.find(b => b.id === badgeId) || null;
}

/**
 * Calculate badge progress (0-1)
 */
export function calculateBadgeProgress(
  badgeId: string,
  memberStats: BadgeCriteria
): number {
  switch (badgeId) {
    case 'first_task':
      return Math.min((memberStats.tasksCompleted || 0) / 1, 1);

    case 'week_streak':
      return Math.min((memberStats.streakDays || 0) / 7, 1);

    case 'home_hero':
      return Math.min((memberStats.tasksCompleted || 0) / 10, 1);

    case 'pet_pal':
      return Math.min((memberStats.petTasksCompleted || 0) / 5, 1);

    case 'five_star':
      return Math.min((memberStats.perfectRatings || 0) / 1, 1);

    case 'speed_demon':
      return Math.min((memberStats.speedWins || 0) / 10, 1);

    case 'perfectionist':
      return Math.min((memberStats.perfectRatings || 0) / 10, 1);

    case 'marathon':
      return Math.min((memberStats.tasksCompleted || 0) / 50, 1);

    case 'legendary':
      return Math.min((memberStats.level || 0) / 50, 1);

    case 'team_player':
      return Math.min((memberStats.helpedOthers || 0) / 20, 1);

    case 'organizer':
      return Math.min((memberStats.tasksCreated || 0) / 100, 1);

    case 'consistent':
      return Math.min((memberStats.streakDays || 0) / 30, 1);

    case 'communicator':
      return Math.min((memberStats.messagesCount || 0) / 100, 1);

    case 'note_taker':
      return Math.min((memberStats.notesCreated || 0) / 50, 1);

    case 'pet_hero':
      return Math.min((memberStats.petTasksCompleted || 0) / 100, 1);

    case 'cleaning_guru':
      return Math.min((memberStats.captainPerfectRatings || 0) / 5, 1);

    case 'motivator':
      return Math.min((memberStats.positiveRatings || 0) / 50, 1);

    case 'unstoppable':
      return Math.min((memberStats.totalActivity || 0) / 100, 1);

    default:
      return 0;
  }
}

/**
 * Format badge progress as string
 */
export function formatBadgeProgress(badgeId: string, memberStats: BadgeCriteria): string {
  const current = getCurrentValue(badgeId, memberStats);
  const target = getTargetValue(badgeId);

  if (target === 0) return 'Locked';

  return `${current}/${target}`;
}

function getCurrentValue(badgeId: string, memberStats: BadgeCriteria): number {
  const map: Record<string, keyof BadgeCriteria> = {
    first_task: 'tasksCompleted',
    home_hero: 'tasksCompleted',
    marathon: 'tasksCompleted',
    week_streak: 'streakDays',
    consistent: 'streakDays',
    pet_pal: 'petTasksCompleted',
    pet_hero: 'petTasksCompleted',
    five_star: 'perfectRatings',
    perfectionist: 'perfectRatings',
    speed_demon: 'speedWins',
    legendary: 'level',
    team_player: 'helpedOthers',
    organizer: 'tasksCreated',
    communicator: 'messagesCount',
    note_taker: 'notesCreated',
    cleaning_guru: 'captainPerfectRatings',
    motivator: 'positiveRatings',
    unstoppable: 'totalActivity',
  };

  const key = map[badgeId];
  return key ? (memberStats[key] || 0) : 0;
}

function getTargetValue(badgeId: string): number {
  const targets: Record<string, number> = {
    first_task: 1,
    week_streak: 7,
    home_hero: 10,
    pet_pal: 5,
    five_star: 1,
    speed_demon: 10,
    perfectionist: 10,
    marathon: 50,
    legendary: 50,
    team_player: 20,
    organizer: 100,
    consistent: 30,
    communicator: 100,
    note_taker: 50,
    pet_hero: 100,
    cleaning_guru: 5,
    motivator: 50,
    unstoppable: 100,
  };

  return targets[badgeId] || 0;
}
