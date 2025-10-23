import {
  calculatePoints,
  calculateLevel,
  calculateLevelProgress,
  getLevelTitle,
  getLevelColor,
  getStreakEmoji,
  calculateStreakBonus,
  POINTS_PER_MINUTE,
  POINTS_PER_LEVEL,
  STREAK_RESET_HOURS,
} from '../gamification';

describe('gamification utilities', () => {
  describe('calculatePoints', () => {
    it('calculates points from minutes', () => {
      expect(calculatePoints(0)).toBe(0);
      expect(calculatePoints(5)).toBe(1); // 5/5 = 1
      expect(calculatePoints(10)).toBe(2); // 10/5 = 2
      expect(calculatePoints(15)).toBe(3);
    });

    it('rounds up partial points', () => {
      expect(calculatePoints(1)).toBe(1); // ceil(1/5) = 1
      expect(calculatePoints(4)).toBe(1); // ceil(4/5) = 1
      expect(calculatePoints(6)).toBe(2); // ceil(6/5) = 2
    });

    it('handles negative minutes as 0', () => {
      expect(calculatePoints(-10)).toBe(0);
    });
  });

  describe('calculateLevel', () => {
    it('calculates level from points', () => {
      expect(calculateLevel(0)).toBe(1); // Starting level
      expect(calculateLevel(50)).toBe(1); // < 100 points
      expect(calculateLevel(100)).toBe(2); // Exactly 100
      expect(calculateLevel(150)).toBe(2); // 100-199
      expect(calculateLevel(200)).toBe(3); // 200-299
      expect(calculateLevel(1000)).toBe(11); // 1000/100 + 1
    });

    it('handles negative points', () => {
      expect(calculateLevel(-100)).toBe(1);
    });
  });

  describe('calculateLevelProgress', () => {
    it('calculates progress to next level', () => {
      expect(calculateLevelProgress(0)).toBe(0); // 0%
      expect(calculateLevelProgress(50)).toBe(50); // 50%
      expect(calculateLevelProgress(100)).toBe(0); // New level, 0%
      expect(calculateLevelProgress(150)).toBe(50); // 50% to level 3
      expect(calculateLevelProgress(99)).toBe(99); // 99%
    });

    it('handles edge cases', () => {
      expect(calculateLevelProgress(-10)).toBe(0);
    });
  });

  describe('getLevelTitle', () => {
    it('returns correct titles for levels', () => {
      expect(getLevelTitle(1)).toBe('Rookie Homie 🌱');
      expect(getLevelTitle(4)).toBe('Rookie Homie 🌱');
      expect(getLevelTitle(5)).toBe('Rising Homie 🔥');
      expect(getLevelTitle(9)).toBe('Rising Homie 🔥');
      expect(getLevelTitle(10)).toBe('Advanced Homie 🌟');
      expect(getLevelTitle(19)).toBe('Advanced Homie 🌟');
      expect(getLevelTitle(20)).toBe('Pro Homie ⭐');
      expect(getLevelTitle(29)).toBe('Pro Homie ⭐');
      expect(getLevelTitle(30)).toBe('Expert Homie 🏆');
      expect(getLevelTitle(39)).toBe('Expert Homie 🏆');
      expect(getLevelTitle(40)).toBe('Master Homie 🎖️');
      expect(getLevelTitle(49)).toBe('Master Homie 🎖️');
      expect(getLevelTitle(50)).toBe('Legendary Homie 👑');
      expect(getLevelTitle(100)).toBe('Legendary Homie 👑');
    });
  });

  describe('getLevelColor', () => {
    it('returns progressive colors', () => {
      const color1 = getLevelColor(1);
      const color10 = getLevelColor(10);
      const color50 = getLevelColor(50);

      expect(color1).toContain('#'); // Valid hex color
      expect(color10).toContain('#');
      expect(color50).toContain('#');
      expect(color1).not.toBe(color50); // Different colors for different levels
    });

    it('handles extreme levels', () => {
      expect(getLevelColor(0)).toContain('#');
      expect(getLevelColor(1000)).toContain('#');
    });
  });

  describe('getStreakEmoji', () => {
    it('returns emoji for streak days', () => {
      expect(getStreakEmoji(0)).toBe('');
      expect(getStreakEmoji(1)).toBe('🔥');
      expect(getStreakEmoji(3)).toBe('🔥');
      expect(getStreakEmoji(7)).toBe('💪');
      expect(getStreakEmoji(14)).toBe('🚀');
      expect(getStreakEmoji(30)).toBe('⭐');
      expect(getStreakEmoji(50)).toBe('💎');
      expect(getStreakEmoji(100)).toBe('👑');
      expect(getStreakEmoji(365)).toBe('👑'); // Max emoji
    });
  });

  describe('calculateStreakBonus', () => {
    it('returns 0 for streaks < 3 days', () => {
      expect(calculateStreakBonus(100, 0)).toBe(0);
      expect(calculateStreakBonus(100, 1)).toBe(0);
      expect(calculateStreakBonus(100, 2)).toBe(0);
    });

    it('calculates 10% bonus per milestone', () => {
      // 3 days = 10% bonus
      expect(calculateStreakBonus(100, 3)).toBe(10); // 100 * 0.1 = 10

      // 7 days = 20% bonus (2 milestones: 3, 7)
      expect(calculateStreakBonus(100, 7)).toBe(20); // 100 * 0.2 = 20

      // 14 days = 30% bonus (3 milestones: 3, 7, 14)
      expect(calculateStreakBonus(100, 14)).toBe(30);

      // 30 days = 40% bonus (4 milestones)
      expect(calculateStreakBonus(100, 30)).toBe(40);

      // 50 days = 50% bonus (5 milestones)
      expect(calculateStreakBonus(100, 50)).toBe(50);

      // 100+ days = 60% bonus (6 milestones: 3,7,14,30,50,100)
      expect(calculateStreakBonus(100, 100)).toBe(60);
      expect(calculateStreakBonus(100, 365)).toBe(60); // Max bonus
    });

    it('rounds up bonus points', () => {
      // Small base points should still give bonus
      expect(calculateStreakBonus(5, 3)).toBe(1); // ceil(5 * 0.1) = 1
      expect(calculateStreakBonus(3, 7)).toBe(1); // ceil(3 * 0.2) = 1
    });

    it('handles edge cases', () => {
      expect(calculateStreakBonus(0, 100)).toBe(0); // 0 base points
      expect(calculateStreakBonus(100, -1)).toBe(0); // Negative streak
    });
  });

  describe('constants', () => {
    it('has correct constant values', () => {
      expect(POINTS_PER_MINUTE).toBe(1 / 5); // 0.2
      expect(POINTS_PER_LEVEL).toBe(100);
      expect(STREAK_RESET_HOURS).toBe(48);
    });
  });

  describe('integration: complete flow', () => {
    it('calculates full gamification flow', () => {
      // User completes 30 minute task
      const minutes = 30;
      const points = calculatePoints(minutes); // 6 points
      expect(points).toBe(6);

      // Total 250 points
      const totalPoints = 250;
      const level = calculateLevel(totalPoints); // Level 3
      expect(level).toBe(3);

      const progress = calculateLevelProgress(totalPoints); // 50% to level 4
      expect(progress).toBe(50);

      const title = getLevelTitle(level);
      expect(title).toContain('Rookie'); // Still rookie at level 3

      // 7-day streak bonus
      const streak = 7;
      const bonus = calculateStreakBonus(points, streak); // 20% of 6 = 2
      expect(bonus).toBe(2); // ceil(6 * 0.2) = 2

      const totalWithBonus = points + bonus;
      expect(totalWithBonus).toBe(8);
    });
  });
});
