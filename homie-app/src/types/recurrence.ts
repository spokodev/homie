/**
 * Recurrence types and interfaces for recurring tasks
 */

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // Every N days/weeks/months
  daysOfWeek?: DayOfWeek[]; // For weekly recurrence
  dayOfMonth?: number; // For monthly recurrence (1-31)
  endDate?: string; // ISO date when recurrence stops
  endAfterOccurrences?: number; // Stop after N occurrences
}

export interface RecurringTask {
  id: string;
  household_id: string;

  // Template fields
  title: string;
  description?: string;
  category?: string;
  room?: string;
  estimated_minutes?: number;
  points?: number;
  assignee_id?: string;

  // Recurrence settings
  recurrence_rule: RecurrenceRule;
  is_active: boolean;

  // Metadata
  last_generated_at?: string;
  next_occurrence_at: string;
  total_occurrences: number;

  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedTaskInstance {
  recurring_task_id: string;
  occurrence_date: string;
  task_id?: string; // ID of the generated task
  was_generated: boolean;
}

/**
 * Calculate next occurrence date based on recurrence rule
 */
export function calculateNextOccurrence(
  currentDate: Date,
  rule: RecurrenceRule
): Date | null {
  const next = new Date(currentDate);

  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + rule.interval);
      break;

    case 'weekly':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // Find next matching day of week
        const dayMap: Record<DayOfWeek, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };

        const targetDays = rule.daysOfWeek.map((d) => dayMap[d]).sort((a, b) => a - b);
        const currentDay = next.getDay();

        // Find next target day
        let nextDay = targetDays.find((d) => d > currentDay);

        if (nextDay === undefined) {
          // No more days this week, go to first day next week
          nextDay = targetDays[0];
          const daysUntilNext = (7 - currentDay + nextDay) + (rule.interval - 1) * 7;
          next.setDate(next.getDate() + daysUntilNext);
        } else {
          // Found a day this week
          next.setDate(next.getDate() + (nextDay - currentDay));
        }
      } else {
        next.setDate(next.getDate() + rule.interval * 7);
      }
      break;

    case 'monthly':
      if (rule.dayOfMonth) {
        next.setMonth(next.getMonth() + rule.interval);
        next.setDate(Math.min(rule.dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      } else {
        next.setMonth(next.getMonth() + rule.interval);
      }
      break;
  }

  // Check if we've passed the end date
  if (rule.endDate && next > new Date(rule.endDate)) {
    return null;
  }

  return next;
}

/**
 * Check if recurrence should end
 */
export function shouldEndRecurrence(
  rule: RecurrenceRule,
  totalOccurrences: number,
  nextDate: Date | null
): boolean {
  // Check end after occurrences
  if (rule.endAfterOccurrences && totalOccurrences >= rule.endAfterOccurrences) {
    return true;
  }

  // Check end date
  if (rule.endDate && nextDate && nextDate > new Date(rule.endDate)) {
    return true;
  }

  // Check if next date is null (no more occurrences)
  if (nextDate === null) {
    return true;
  }

  return false;
}

/**
 * Get human-readable recurrence description
 */
export function getRecurrenceDescription(rule: RecurrenceRule): string {
  const { frequency, interval, daysOfWeek, dayOfMonth, endDate, endAfterOccurrences } = rule;

  let description = '';

  // Frequency part
  if (frequency === 'daily') {
    description = interval === 1 ? 'Every day' : `Every ${interval} days`;
  } else if (frequency === 'weekly') {
    if (daysOfWeek && daysOfWeek.length > 0) {
      const dayNames = daysOfWeek.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
      description = interval === 1
        ? `Every week on ${dayNames}`
        : `Every ${interval} weeks on ${dayNames}`;
    } else {
      description = interval === 1 ? 'Every week' : `Every ${interval} weeks`;
    }
  } else if (frequency === 'monthly') {
    if (dayOfMonth) {
      const suffix = getDayOfMonthSuffix(dayOfMonth);
      description = interval === 1
        ? `Every month on the ${dayOfMonth}${suffix}`
        : `Every ${interval} months on the ${dayOfMonth}${suffix}`;
    } else {
      description = interval === 1 ? 'Every month' : `Every ${interval} months`;
    }
  }

  // End condition
  if (endDate) {
    const date = new Date(endDate);
    description += ` until ${date.toLocaleDateString()}`;
  } else if (endAfterOccurrences) {
    description += ` for ${endAfterOccurrences} times`;
  }

  return description;
}

function getDayOfMonthSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
