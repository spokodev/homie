import {
  shouldRotate,
  getNextAssignee,
  calculateNextRotationTime,
  RotationInterval,
} from '@/utils/rotation';

describe('Rotation Logic', () => {
  const mockAssignees = [
    'member-1',
    'member-2',
    'member-3',
    'member-4',
  ];

  describe('shouldRotate', () => {
    const now = new Date('2025-01-27T12:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should rotate every minute', () => {
      const lastRotation = new Date('2025-01-27T11:59:00Z'); // 1 minute ago
      const interval: RotationInterval = { value: 1, unit: 'minute' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should not rotate if less than a minute passed', () => {
      const lastRotation = new Date('2025-01-27T11:59:30Z'); // 30 seconds ago
      const interval: RotationInterval = { value: 1, unit: 'minute' };

      expect(shouldRotate(lastRotation, interval)).toBe(false);
    });

    it('should rotate every 5 minutes', () => {
      const lastRotation = new Date('2025-01-27T11:55:00Z'); // 5 minutes ago
      const interval: RotationInterval = { value: 5, unit: 'minute' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should rotate hourly', () => {
      const lastRotation = new Date('2025-01-27T11:00:00Z'); // 1 hour ago
      const interval: RotationInterval = { value: 1, unit: 'hour' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should rotate every 3 hours', () => {
      const lastRotation = new Date('2025-01-27T09:00:00Z'); // 3 hours ago
      const interval: RotationInterval = { value: 3, unit: 'hour' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should rotate daily', () => {
      const lastRotation = new Date('2025-01-26T12:00:00Z'); // 1 day ago
      const interval: RotationInterval = { value: 1, unit: 'day' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should rotate every 3 days', () => {
      const lastRotation = new Date('2025-01-24T12:00:00Z'); // 3 days ago
      const interval: RotationInterval = { value: 3, unit: 'day' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should rotate weekly', () => {
      const lastRotation = new Date('2025-01-20T12:00:00Z'); // 1 week ago
      const interval: RotationInterval = { value: 1, unit: 'week' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should rotate bi-weekly', () => {
      const lastRotation = new Date('2025-01-13T12:00:00Z'); // 2 weeks ago
      const interval: RotationInterval = { value: 2, unit: 'week' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should rotate monthly', () => {
      const lastRotation = new Date('2024-12-27T12:00:00Z'); // 1 month ago
      const interval: RotationInterval = { value: 1, unit: 'month' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should rotate quarterly (3 months)', () => {
      const lastRotation = new Date('2024-10-27T12:00:00Z'); // 3 months ago
      const interval: RotationInterval = { value: 3, unit: 'month' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should rotate yearly', () => {
      const lastRotation = new Date('2024-01-27T12:00:00Z'); // 1 year ago
      const interval: RotationInterval = { value: 1, unit: 'year' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should rotate every 2 years', () => {
      const lastRotation = new Date('2023-01-27T12:00:00Z'); // 2 years ago
      const interval: RotationInterval = { value: 2, unit: 'year' };

      expect(shouldRotate(lastRotation, interval)).toBe(true);
    });

    it('should handle manual override', () => {
      const lastRotation = new Date('2025-01-20T12:00:00Z'); // 1 week ago
      const interval: RotationInterval = { value: 1, unit: 'week' };
      const manualOverrideUntil = new Date('2025-01-28T12:00:00Z'); // Tomorrow

      expect(shouldRotate(lastRotation, interval, manualOverrideUntil)).toBe(false);
    });

    it('should rotate if manual override expired', () => {
      const lastRotation = new Date('2025-01-20T12:00:00Z'); // 1 week ago
      const interval: RotationInterval = { value: 1, unit: 'week' };
      const manualOverrideUntil = new Date('2025-01-26T12:00:00Z'); // Yesterday

      expect(shouldRotate(lastRotation, interval, manualOverrideUntil)).toBe(true);
    });

    it('should always rotate if never rotated before', () => {
      const interval: RotationInterval = { value: 1, unit: 'year' };

      expect(shouldRotate(null, interval)).toBe(true);
    });
  });

  describe('getNextAssignee', () => {
    it('should return next assignee in rotation', () => {
      const currentIndex = 0;
      const nextAssignee = getNextAssignee(mockAssignees, currentIndex, true);

      expect(nextAssignee).toEqual({
        assigneeId: 'member-2',
        newIndex: 1,
      });
    });

    it('should loop back to first after last', () => {
      const currentIndex = 3; // Last member
      const nextAssignee = getNextAssignee(mockAssignees, currentIndex, true);

      expect(nextAssignee).toEqual({
        assigneeId: 'member-1',
        newIndex: 0,
      });
    });

    it('should return current assignee if not rotating', () => {
      const currentIndex = 1;
      const nextAssignee = getNextAssignee(mockAssignees, currentIndex, false);

      expect(nextAssignee).toEqual({
        assigneeId: 'member-2',
        newIndex: 1,
      });
    });

    it('should skip inactive members', () => {
      const assigneesWithInactive = [
        'member-1',
        null, // Inactive member
        'member-3',
      ];
      const currentIndex = 0;
      const nextAssignee = getNextAssignee(assigneesWithInactive, currentIndex, true);

      expect(nextAssignee).toEqual({
        assigneeId: 'member-3',
        newIndex: 2,
      });
    });

    it('should handle single assignee', () => {
      const singleAssignee = ['member-1'];
      const currentIndex = 0;
      const nextAssignee = getNextAssignee(singleAssignee, currentIndex, true);

      expect(nextAssignee).toEqual({
        assigneeId: 'member-1',
        newIndex: 0,
      });
    });

    it('should handle empty rotation list', () => {
      const emptyList: string[] = [];
      const currentIndex = 0;
      const nextAssignee = getNextAssignee(emptyList, currentIndex, true);

      expect(nextAssignee).toBeNull();
    });

    it('should handle manual assignee change', () => {
      const currentIndex = 0;
      const manualAssigneeId = 'member-3';
      const nextAssignee = getNextAssignee(
        mockAssignees,
        currentIndex,
        false,
        manualAssigneeId
      );

      expect(nextAssignee).toEqual({
        assigneeId: 'member-3',
        newIndex: 2,
      });
    });
  });

  describe('calculateNextRotationTime', () => {
    const baseTime = new Date('2025-01-27T12:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(baseTime);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate next rotation in minutes', () => {
      const interval: RotationInterval = { value: 30, unit: 'minute' };
      const nextTime = calculateNextRotationTime(baseTime, interval);

      expect(nextTime).toEqual(new Date('2025-01-27T12:30:00Z'));
    });

    it('should calculate next rotation in hours', () => {
      const interval: RotationInterval = { value: 6, unit: 'hour' };
      const nextTime = calculateNextRotationTime(baseTime, interval);

      expect(nextTime).toEqual(new Date('2025-01-27T18:00:00Z'));
    });

    it('should calculate next rotation in days', () => {
      const interval: RotationInterval = { value: 3, unit: 'day' };
      const nextTime = calculateNextRotationTime(baseTime, interval);

      expect(nextTime).toEqual(new Date('2025-01-30T12:00:00Z'));
    });

    it('should calculate next rotation in weeks', () => {
      const interval: RotationInterval = { value: 2, unit: 'week' };
      const nextTime = calculateNextRotationTime(baseTime, interval);

      expect(nextTime).toEqual(new Date('2025-02-10T12:00:00Z'));
    });

    it('should calculate next rotation in months', () => {
      const interval: RotationInterval = { value: 1, unit: 'month' };
      const nextTime = calculateNextRotationTime(baseTime, interval);

      expect(nextTime).toEqual(new Date('2025-02-27T12:00:00Z'));
    });

    it('should handle month edge cases (31st to February)', () => {
      const jan31 = new Date('2025-01-31T12:00:00Z');
      jest.setSystemTime(jan31);

      const interval: RotationInterval = { value: 1, unit: 'month' };
      const nextTime = calculateNextRotationTime(jan31, interval);

      // Should go to Feb 28 (or 29 in leap year)
      expect(nextTime.getDate()).toBeLessThanOrEqual(29);
      expect(nextTime.getMonth()).toBe(1); // February
    });

    it('should calculate next rotation in years', () => {
      const interval: RotationInterval = { value: 1, unit: 'year' };
      const nextTime = calculateNextRotationTime(baseTime, interval);

      expect(nextTime).toEqual(new Date('2026-01-27T12:00:00Z'));
    });

    it('should handle leap year for yearly rotation', () => {
      const feb29 = new Date('2024-02-29T12:00:00Z'); // Leap year
      const interval: RotationInterval = { value: 1, unit: 'year' };
      const nextTime = calculateNextRotationTime(feb29, interval);

      // Should go to Feb 28 in non-leap year
      expect(nextTime).toEqual(new Date('2025-02-28T12:00:00Z'));
    });

    it('should calculate from now if no last rotation provided', () => {
      const interval: RotationInterval = { value: 1, unit: 'hour' };
      const nextTime = calculateNextRotationTime(null, interval);

      expect(nextTime).toEqual(new Date('2025-01-27T13:00:00Z'));
    });
  });

  describe('Complex rotation scenarios', () => {
    it('should handle rotation with member leaving and rejoining', () => {
      let assignees = ['member-1', 'member-2', 'member-3'];
      let currentIndex = 0;

      // First rotation
      let next = getNextAssignee(assignees, currentIndex, true);
      expect(next?.assigneeId).toBe('member-2');
      currentIndex = next?.newIndex || 0;

      // Member-3 leaves
      assignees = ['member-1', 'member-2'];

      // Continue rotation
      next = getNextAssignee(assignees, currentIndex, true);
      expect(next?.assigneeId).toBe('member-1');
      currentIndex = next?.newIndex || 0;

      // Member-3 rejoins
      assignees = ['member-1', 'member-2', 'member-3'];

      // Continue rotation
      next = getNextAssignee(assignees, currentIndex, true);
      expect(next?.assigneeId).toBe('member-2');
    });

    it('should maintain rotation schedule across time changes', () => {
      // Test daylight saving time transitions
      const interval: RotationInterval = { value: 1, unit: 'day' };

      // Spring forward (lose an hour)
      const beforeDST = new Date('2025-03-08T12:00:00');
      const afterDST = calculateNextRotationTime(beforeDST, interval);

      // Should still be 24 hours later in UTC
      const diffHours = (afterDST.getTime() - beforeDST.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBe(24);
    });

    it('should handle timezone-aware rotations', () => {
      // Rotation should happen at same local time regardless of timezone
      const interval: RotationInterval = { value: 1, unit: 'day' };
      const localTime = new Date('2025-01-27T09:00:00'); // 9 AM local

      const nextRotation = calculateNextRotationTime(localTime, interval);

      // Should be 9 AM next day
      expect(nextRotation.getHours()).toBe(localTime.getHours());
      expect(nextRotation.getMinutes()).toBe(localTime.getMinutes());
    });
  });
});