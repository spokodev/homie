/**
 * Rotation utilities for task assignment
 * Supports rotation intervals from minutes to years
 */

export type RotationUnit = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export interface RotationInterval {
  value: number;
  unit: RotationUnit;
}

export interface RotationResult {
  assigneeId: string;
  newIndex: number;
}

/**
 * Check if rotation should happen based on interval
 * @param lastRotation - Last rotation timestamp
 * @param interval - Rotation interval configuration
 * @param manualOverrideUntil - Optional manual override expiration
 * @returns true if rotation should happen
 */
export function shouldRotate(
  lastRotation: Date | null,
  interval: RotationInterval,
  manualOverrideUntil?: Date
): boolean {
  // If manual override is active, don't rotate
  if (manualOverrideUntil && manualOverrideUntil > new Date()) {
    return false;
  }

  // Always rotate if never rotated before
  if (!lastRotation) {
    return true;
  }

  const now = new Date();
  const timeSinceLastRotation = now.getTime() - lastRotation.getTime();

  // Calculate interval in milliseconds
  let intervalMs: number;
  switch (interval.unit) {
    case 'minute':
      intervalMs = interval.value * 60 * 1000;
      break;
    case 'hour':
      intervalMs = interval.value * 60 * 60 * 1000;
      break;
    case 'day':
      intervalMs = interval.value * 24 * 60 * 60 * 1000;
      break;
    case 'week':
      intervalMs = interval.value * 7 * 24 * 60 * 60 * 1000;
      break;
    case 'month':
      // Use date arithmetic for months
      const targetDate = new Date(lastRotation);
      targetDate.setMonth(targetDate.getMonth() + interval.value);
      return now >= targetDate;
    case 'year':
      // Use date arithmetic for years
      const targetYear = new Date(lastRotation);
      targetYear.setFullYear(targetYear.getFullYear() + interval.value);
      return now >= targetYear;
    default:
      return false;
  }

  return timeSinceLastRotation >= intervalMs;
}

/**
 * Get next assignee from rotation list
 * @param assignees - List of assignee IDs
 * @param currentIndex - Current assignee index
 * @param shouldRotate - Whether rotation should happen
 * @param manualAssigneeId - Optional manual assignee override
 * @returns Next assignee and new index, or null if no assignees
 */
export function getNextAssignee(
  assignees: (string | null)[],
  currentIndex: number,
  shouldRotate: boolean,
  manualAssigneeId?: string
): RotationResult | null {
  // Filter out null/inactive members
  const activeAssignees = assignees.filter(a => a !== null) as string[];

  if (activeAssignees.length === 0) {
    return null;
  }

  // Handle manual assignee override
  if (manualAssigneeId) {
    const manualIndex = activeAssignees.indexOf(manualAssigneeId);
    if (manualIndex !== -1) {
      return {
        assigneeId: manualAssigneeId,
        newIndex: manualIndex,
      };
    }
  }

  if (!shouldRotate) {
    // Return current assignee
    const currentAssignee = activeAssignees[currentIndex] || activeAssignees[0];
    return {
      assigneeId: currentAssignee,
      newIndex: currentIndex,
    };
  }

  // Calculate next index with wraparound
  const nextIndex = (currentIndex + 1) % activeAssignees.length;
  return {
    assigneeId: activeAssignees[nextIndex],
    newIndex: nextIndex,
  };
}

/**
 * Calculate next rotation time
 * @param lastRotation - Last rotation timestamp or null for now
 * @param interval - Rotation interval configuration
 * @returns Next rotation timestamp
 */
export function calculateNextRotationTime(
  lastRotation: Date | null,
  interval: RotationInterval
): Date {
  const baseTime = lastRotation || new Date();
  const nextTime = new Date(baseTime);

  switch (interval.unit) {
    case 'minute':
      nextTime.setMinutes(nextTime.getMinutes() + interval.value);
      break;
    case 'hour':
      nextTime.setHours(nextTime.getHours() + interval.value);
      break;
    case 'day':
      nextTime.setDate(nextTime.getDate() + interval.value);
      break;
    case 'week':
      nextTime.setDate(nextTime.getDate() + (interval.value * 7));
      break;
    case 'month':
      nextTime.setMonth(nextTime.getMonth() + interval.value);
      // Handle month overflow (e.g., Jan 31 + 1 month)
      if (nextTime.getDate() !== baseTime.getDate()) {
        // Set to last day of previous month
        nextTime.setDate(0);
      }
      break;
    case 'year':
      nextTime.setFullYear(nextTime.getFullYear() + interval.value);
      // Handle leap year edge case (Feb 29)
      if (nextTime.getMonth() !== baseTime.getMonth()) {
        // Set to last day of February
        nextTime.setMonth(2, 0);
      }
      break;
  }

  return nextTime;
}

/**
 * Format rotation interval for display
 * @param interval - Rotation interval configuration
 * @returns Human-readable string
 */
export function formatRotationInterval(interval: RotationInterval): string {
  const { value, unit } = interval;

  if (value === 1) {
    switch (unit) {
      case 'minute': return 'Every minute';
      case 'hour': return 'Hourly';
      case 'day': return 'Daily';
      case 'week': return 'Weekly';
      case 'month': return 'Monthly';
      case 'year': return 'Yearly';
    }
  }

  const unitLabel = value === 1 ? unit : `${unit}s`;
  return `Every ${value} ${unitLabel}`;
}

/**
 * Parse rotation interval from string
 * @param intervalStr - String like "1:hour", "3:day", etc.
 * @returns RotationInterval or null if invalid
 */
export function parseRotationInterval(intervalStr: string): RotationInterval | null {
  const parts = intervalStr.split(':');
  if (parts.length !== 2) return null;

  const value = parseInt(parts[0]);
  const unit = parts[1] as RotationUnit;

  if (isNaN(value) || value < 1) return null;
  if (!['minute', 'hour', 'day', 'week', 'month', 'year'].includes(unit)) return null;

  return { value, unit };
}

/**
 * Get rotation interval options for UI
 * @returns Array of common rotation intervals
 */
export function getRotationIntervalOptions(): Array<{
  label: string;
  value: string;
  interval: RotationInterval;
}> {
  return [
    // Minutes
    { label: 'Every minute', value: '1:minute', interval: { value: 1, unit: 'minute' } },
    { label: 'Every 5 minutes', value: '5:minute', interval: { value: 5, unit: 'minute' } },
    { label: 'Every 15 minutes', value: '15:minute', interval: { value: 15, unit: 'minute' } },
    { label: 'Every 30 minutes', value: '30:minute', interval: { value: 30, unit: 'minute' } },

    // Hours
    { label: 'Hourly', value: '1:hour', interval: { value: 1, unit: 'hour' } },
    { label: 'Every 2 hours', value: '2:hour', interval: { value: 2, unit: 'hour' } },
    { label: 'Every 3 hours', value: '3:hour', interval: { value: 3, unit: 'hour' } },
    { label: 'Every 6 hours', value: '6:hour', interval: { value: 6, unit: 'hour' } },
    { label: 'Every 12 hours', value: '12:hour', interval: { value: 12, unit: 'hour' } },

    // Days
    { label: 'Daily', value: '1:day', interval: { value: 1, unit: 'day' } },
    { label: 'Every 2 days', value: '2:day', interval: { value: 2, unit: 'day' } },
    { label: 'Every 3 days', value: '3:day', interval: { value: 3, unit: 'day' } },

    // Weeks
    { label: 'Weekly', value: '1:week', interval: { value: 1, unit: 'week' } },
    { label: 'Bi-weekly', value: '2:week', interval: { value: 2, unit: 'week' } },

    // Months
    { label: 'Monthly', value: '1:month', interval: { value: 1, unit: 'month' } },
    { label: 'Every 2 months', value: '2:month', interval: { value: 2, unit: 'month' } },
    { label: 'Quarterly', value: '3:month', interval: { value: 3, unit: 'month' } },
    { label: 'Every 6 months', value: '6:month', interval: { value: 6, unit: 'month' } },

    // Years
    { label: 'Yearly', value: '1:year', interval: { value: 1, unit: 'year' } },
    { label: 'Every 2 years', value: '2:year', interval: { value: 2, unit: 'year' } },
  ];
}

/**
 * Calculate rotation statistics
 * @param rotationHistory - Array of rotation timestamps
 * @returns Statistics object
 */
export function calculateRotationStats(rotationHistory: Date[]): {
  totalRotations: number;
  averageInterval: number | null;
  lastRotation: Date | null;
} {
  if (rotationHistory.length === 0) {
    return {
      totalRotations: 0,
      averageInterval: null,
      lastRotation: null,
    };
  }

  const sortedHistory = [...rotationHistory].sort((a, b) => a.getTime() - b.getTime());

  let totalInterval = 0;
  for (let i = 1; i < sortedHistory.length; i++) {
    totalInterval += sortedHistory[i].getTime() - sortedHistory[i - 1].getTime();
  }

  return {
    totalRotations: rotationHistory.length,
    averageInterval: sortedHistory.length > 1 ? totalInterval / (sortedHistory.length - 1) : null,
    lastRotation: sortedHistory[sortedHistory.length - 1],
  };
}