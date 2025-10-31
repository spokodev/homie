/**
 * Gamification utilities for points, levels, and achievements
 */

// Points calculation
export const POINTS_PER_MINUTE = 1 / 5; // 5 minutes = 1 point
export const POINTS_PER_LEVEL = 100;

/**
 * Calculate points for estimated minutes
 */
export function calculatePoints(minutes: number): number {
  return Math.ceil(minutes * POINTS_PER_MINUTE);
}

/**
 * Calculate level from total points
 */
export function calculateLevel(points: number): number {
  return Math.floor(points / POINTS_PER_LEVEL) + 1;
}

/**
 * Calculate progress to next level (0-100)
 */
export function calculateLevelProgress(points: number): number {
  const pointsInCurrentLevel = points % POINTS_PER_LEVEL;
  return Math.floor((pointsInCurrentLevel / POINTS_PER_LEVEL) * 100);
}

/**
 * Get points needed for next level
 */
export function getPointsToNextLevel(points: number): number {
  const currentLevelPoints = points % POINTS_PER_LEVEL;
  return POINTS_PER_LEVEL - currentLevelPoints;
}

/**
 * Check if user leveled up
 */
export function didLevelUp(oldPoints: number, newPoints: number): boolean {
  const oldLevel = calculateLevel(oldPoints);
  const newLevel = calculateLevel(newPoints);
  return newLevel > oldLevel;
}

/**
 * Get level title/badge based on level
 */
export function getLevelTitle(level: number): string {
  if (level >= 50) return 'Legendary Homie 👑';
  if (level >= 40) return 'Master Homie 🎖️';
  if (level >= 30) return 'Expert Homie 🏆';
  if (level >= 20) return 'Pro Homie ⭐';
  if (level >= 10) return 'Advanced Homie 🌟';
  if (level >= 5) return 'Rising Homie 🔥';
  return 'Rookie Homie 🌱';
}

/**
 * Get level color based on level
 */
export function getLevelColor(level: number): string {
  if (level >= 50) return '#FFD700'; // Gold
  if (level >= 40) return '#FF6B6B'; // Red
  if (level >= 30) return '#4ECDC4'; // Teal
  if (level >= 20) return '#FFD93D'; // Yellow
  if (level >= 10) return '#6BCB77'; // Green
  if (level >= 5) return '#95E1D3'; // Light Teal
  return '#A8E6CF'; // Light Green
}

// Streak calculation
export const STREAK_RESET_HOURS = 48; // Reset if no activity for 48h

/**
 * Check if streak should be maintained
 */
export function shouldMaintainStreak(lastActivityDate?: string): boolean {
  if (!lastActivityDate) return false;

  const now = new Date();
  const lastActivity = new Date(lastActivityDate);
  const hoursDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

  return hoursDiff <= STREAK_RESET_HOURS;
}

/**
 * Calculate streak days
 */
export function calculateStreakDays(
  currentStreak: number,
  lastActivityDate?: string
): number {
  if (!lastActivityDate) {
    return 1; // First activity
  }

  const now = new Date();
  const lastActivity = new Date(lastActivityDate);

  // Calculate the difference in days (using UTC to avoid timezone issues)
  const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const lastUTC = Date.UTC(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
  const daysDiff = Math.floor((nowUTC - lastUTC) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Same day - maintain current streak
    return currentStreak;
  } else if (daysDiff === 1) {
    // Consecutive day - increment streak
    return currentStreak + 1;
  } else if (daysDiff <= 2 && !shouldMaintainStreak(lastActivityDate)) {
    // Within 48 hours but not consecutive days - maintain streak
    return currentStreak;
  } else {
    // More than 2 days or 48 hours - reset streak
    return 1;
  }
}

/**
 * Get streak emoji based on days
 */
export function getStreakEmoji(days: number): string {
  if (days >= 100) return '💯';
  if (days >= 50) return '🌟';
  if (days >= 30) return '⚡';
  if (days >= 14) return '🔥';
  if (days >= 7) return '✨';
  if (days >= 3) return '💪';
  return '🎯';
}

/**
 * Get streak message based on days
 */
export function getStreakMessage(days: number): string {
  if (days >= 100) return 'LEGENDARY STREAK!';
  if (days >= 50) return 'Incredible!';
  if (days >= 30) return 'On fire!';
  if (days >= 14) return 'Two weeks strong!';
  if (days >= 7) return 'One week!';
  if (days >= 3) return 'Keep it up!';
  return 'Great start!';
}

// Bonus points
export const STREAK_BONUS_MULTIPLIER = 0.1; // 10% bonus per streak milestone

/**
 * Calculate bonus points for streak
 */
export function calculateStreakBonus(basePoints: number, streakDays: number): number {
  if (streakDays < 3) return 0;

  // Bonus kicks in after 3 days
  const milestones = [3, 7, 14, 30, 50, 100];
  let multiplier = 0;

  for (const milestone of milestones) {
    if (streakDays >= milestone) {
      multiplier += STREAK_BONUS_MULTIPLIER;
    }
  }

  return Math.ceil(basePoints * multiplier);
}
