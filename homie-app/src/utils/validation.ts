/**
 * Input Validation & Sanitization Utilities
 * Prevents XSS, validates formats, enforces length limits
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Email validation using RFC 5322 compliant regex
 * Validates:
 * - Proper email structure (local@domain.tld)
 * - No consecutive dots
 * - Valid characters in local and domain parts
 * - Proper TLD (2+ characters)
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  // Check length constraints
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email is too long (max 254 characters)' };
  }

  // RFC 5322 compliant regex with additional checks
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Additional checks for common mistakes
  const [localPart, domainPart] = trimmed.split('@');

  // Check local part length (max 64 characters per RFC)
  if (localPart.length > 64) {
    return { isValid: false, error: 'Email local part is too long' };
  }

  // Check for consecutive dots
  if (trimmed.includes('..')) {
    return { isValid: false, error: 'Email cannot contain consecutive dots' };
  }

  // Check for valid TLD (at least 2 characters)
  const tld = domainPart.split('.').pop();
  if (!tld || tld.length < 2) {
    return { isValid: false, error: 'Please enter a valid email domain' };
  }

  return { isValid: true };
}

/**
 * Password validation
 * Min 8 characters, at least 1 uppercase, 1 lowercase, 1 number
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 100) {
    return { isValid: false, error: 'Password must be less than 100 characters' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      isValid: false,
      error: 'Password must contain uppercase, lowercase, and number',
    };
  }

  return { isValid: true };
}

/**
 * Text input validation with length constraints
 */
export function validateText(
  text: string,
  options: {
    fieldName: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    allowEmpty?: boolean;
  }
): ValidationResult {
  const { fieldName, minLength = 1, maxLength = 255, required = true, allowEmpty = false } = options;

  const trimmed = text ? text.trim() : '';

  if (required && trimmed.length === 0 && !allowEmpty) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (trimmed.length > 0) {
    if (trimmed.length < minLength) {
      return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }

    if (trimmed.length > maxLength) {
      return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
    }
  }

  return { isValid: true };
}

/**
 * Task title validation
 */
export function validateTaskTitle(title: string): ValidationResult {
  return validateText(title, {
    fieldName: 'Task title',
    minLength: 3,
    maxLength: 100,
    required: true,
  });
}

/**
 * Task description validation
 */
export function validateTaskDescription(description: string): ValidationResult {
  return validateText(description, {
    fieldName: 'Description',
    minLength: 0,
    maxLength: 500,
    required: false,
    allowEmpty: true,
  });
}

/**
 * Member name validation
 */
export function validateMemberName(name: string): ValidationResult {
  return validateText(name, {
    fieldName: 'Name',
    minLength: 2,
    maxLength: 50,
    required: true,
  });
}

/**
 * Household name validation
 */
export function validateHouseholdName(name: string): ValidationResult {
  return validateText(name, {
    fieldName: 'Household name',
    minLength: 2,
    maxLength: 50,
    required: true,
  });
}

/**
 * Room name validation
 */
export function validateRoomName(name: string): ValidationResult {
  return validateText(name, {
    fieldName: 'Room name',
    minLength: 2,
    maxLength: 30,
    required: true,
  });
}

/**
 * Note content validation
 */
export function validateNoteContent(content: string): ValidationResult {
  return validateText(content, {
    fieldName: 'Note',
    minLength: 1,
    maxLength: 500,
    required: true,
  });
}

/**
 * Message validation
 */
export function validateMessage(message: string): ValidationResult {
  return validateText(message, {
    fieldName: 'Message',
    minLength: 1,
    maxLength: 1000,
    required: true,
  });
}

/**
 * Number validation (for points, minutes, etc.)
 */
export function validateNumber(
  value: string | number,
  options: {
    fieldName: string;
    min?: number;
    max?: number;
    integer?: boolean;
  }
): ValidationResult {
  const { fieldName, min, max, integer = false } = options;

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (integer && !Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} must be a whole number` };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `${fieldName} must be at most ${max}` };
  }

  return { isValid: true };
}

/**
 * Estimated minutes validation
 */
export function validateEstimatedMinutes(minutes: string | number): ValidationResult {
  return validateNumber(minutes, {
    fieldName: 'Estimated time',
    min: 1,
    max: 1440, // 24 hours
    integer: true,
  });
}

/**
 * Points validation
 */
export function validatePoints(points: string | number): ValidationResult {
  return validateNumber(points, {
    fieldName: 'Points',
    min: 1,
    max: 1000,
    integer: true,
  });
}

/**
 * Sanitize text to prevent XSS
 * Removes/escapes potentially dangerous characters
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  return text
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize HTML (for rich text editors - if we add them later)
 * For now, just strip all HTML tags
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

/**
 * Validate avatar selection (emoji only, no arbitrary text)
 */
export function validateAvatar(avatar: string, allowedAvatars: string[]): ValidationResult {
  if (!avatar) {
    return { isValid: false, error: 'Please select an avatar' };
  }

  if (!allowedAvatars.includes(avatar)) {
    return { isValid: false, error: 'Invalid avatar selection' };
  }

  return { isValid: true };
}

/**
 * Validate icon selection
 */
export function validateIcon(icon: string, allowedIcons: string[]): ValidationResult {
  if (!icon) {
    return { isValid: false, error: 'Please select an icon' };
  }

  if (!allowedIcons.includes(icon)) {
    return { isValid: false, error: 'Invalid icon selection' };
  }

  return { isValid: true };
}

/**
 * Validate date (ensure it's not in the past for due dates)
 */
export function validateDueDate(date: Date | string): ValidationResult {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }

  // Allow past dates for now (user might want to log completed tasks from the past)
  // If you want to enforce future dates only:
  // const now = new Date();
  // if (dateObj < now) {
  //   return { isValid: false, error: 'Due date must be in the future' };
  // }

  return { isValid: true };
}

/**
 * Batch validation helper
 * Returns first error or success
 */
export function validateAll(...results: ValidationResult[]): ValidationResult {
  for (const result of results) {
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}
