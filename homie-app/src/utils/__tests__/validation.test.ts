import {
  validateEmail,
  validatePassword,
  validateText,
  validateTaskTitle,
  validateTaskDescription,
  validateMemberName,
  validateHouseholdName,
  validateNumber,
  validateEstimatedMinutes,
  validatePoints,
  sanitizeText,
  sanitizeHTML,
  validateAvatar,
  validateIcon,
  validateAll,
} from '../validation';

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('validates correct email', () => {
      expect(validateEmail('test@example.com')).toEqual({ isValid: true });
      expect(validateEmail('user.name+tag@example.co.uk')).toEqual({ isValid: true });
    });

    it('rejects invalid email', () => {
      expect(validateEmail('').error).toBeTruthy();
      expect(validateEmail('invalid').error).toBeTruthy();
      expect(validateEmail('@example.com').error).toBeTruthy();
      expect(validateEmail('test@').error).toBeTruthy();
    });
  });

  describe('validatePassword', () => {
    it('validates strong password', () => {
      expect(validatePassword('Password123')).toEqual({ isValid: true });
      expect(validatePassword('MySecurePass1')).toEqual({ isValid: true });
    });

    it('rejects weak password', () => {
      expect(validatePassword('short').error).toBeTruthy();
      expect(validatePassword('alllowercase1').error).toBeTruthy();
      expect(validatePassword('ALLUPPERCASE1').error).toBeTruthy();
      expect(validatePassword('NoNumbers').error).toBeTruthy();
    });

    it('rejects empty password', () => {
      expect(validatePassword('').error).toBe('Password is required');
    });

    it('rejects too long password', () => {
      const longPassword = 'A'.repeat(101) + '1';
      expect(validatePassword(longPassword).error).toBeTruthy();
    });
  });

  describe('validateText', () => {
    it('validates text within constraints', () => {
      expect(
        validateText('Hello', { fieldName: 'Name', minLength: 2, maxLength: 10 })
      ).toEqual({ isValid: true });
    });

    it('rejects too short text', () => {
      const result = validateText('A', { fieldName: 'Name', minLength: 2 });
      expect(result.error).toBe('Name must be at least 2 characters');
    });

    it('rejects too long text', () => {
      const result = validateText('A'.repeat(100), {
        fieldName: 'Name',
        maxLength: 50,
      });
      expect(result.error).toBe('Name must be less than 50 characters');
    });

    it('requires non-empty when required', () => {
      const result = validateText('', { fieldName: 'Name', required: true });
      expect(result.error).toBe('Name is required');
    });

    it('allows empty when not required', () => {
      expect(
        validateText('', { fieldName: 'Name', required: false, allowEmpty: true })
      ).toEqual({ isValid: true });
    });
  });

  describe('validateTaskTitle', () => {
    it('validates valid task title', () => {
      expect(validateTaskTitle('Clean kitchen')).toEqual({ isValid: true });
    });

    it('rejects too short title', () => {
      expect(validateTaskTitle('AB').error).toBeTruthy();
    });

    it('rejects too long title', () => {
      expect(validateTaskTitle('A'.repeat(101)).error).toBeTruthy();
    });
  });

  describe('validateTaskDescription', () => {
    it('validates valid description', () => {
      expect(validateTaskDescription('This is a description')).toEqual({
        isValid: true,
      });
    });

    it('allows empty description', () => {
      expect(validateTaskDescription('')).toEqual({ isValid: true });
    });

    it('rejects too long description', () => {
      expect(validateTaskDescription('A'.repeat(501)).error).toBeTruthy();
    });
  });

  describe('validateMemberName', () => {
    it('validates valid member name', () => {
      expect(validateMemberName('John Doe')).toEqual({ isValid: true });
    });

    it('rejects too short name', () => {
      expect(validateMemberName('A').error).toBeTruthy();
    });
  });

  describe('validateHouseholdName', () => {
    it('validates valid household name', () => {
      expect(validateHouseholdName('Smith Family')).toEqual({ isValid: true });
    });

    it('rejects too short name', () => {
      expect(validateHouseholdName('A').error).toBeTruthy();
    });
  });

  describe('validateNumber', () => {
    it('validates valid number', () => {
      expect(validateNumber(5, { fieldName: 'Count' })).toEqual({ isValid: true });
      expect(validateNumber('10', { fieldName: 'Count' })).toEqual({ isValid: true });
    });

    it('validates with min constraint', () => {
      expect(validateNumber(5, { fieldName: 'Count', min: 10 }).error).toBeTruthy();
      expect(validateNumber(15, { fieldName: 'Count', min: 10 })).toEqual({
        isValid: true,
      });
    });

    it('validates with max constraint', () => {
      expect(validateNumber(15, { fieldName: 'Count', max: 10 }).error).toBeTruthy();
      expect(validateNumber(5, { fieldName: 'Count', max: 10 })).toEqual({
        isValid: true,
      });
    });

    it('validates integer requirement', () => {
      expect(validateNumber(5.5, { fieldName: 'Count', integer: true }).error).toBeTruthy();
      expect(validateNumber(5, { fieldName: 'Count', integer: true })).toEqual({
        isValid: true,
      });
    });

    it('rejects non-number', () => {
      expect(validateNumber('abc', { fieldName: 'Count' }).error).toBeTruthy();
    });
  });

  describe('validateEstimatedMinutes', () => {
    it('validates valid minutes', () => {
      expect(validateEstimatedMinutes(30)).toEqual({ isValid: true });
      expect(validateEstimatedMinutes('60')).toEqual({ isValid: true });
    });

    it('rejects out of range', () => {
      expect(validateEstimatedMinutes(0).error).toBeTruthy();
      expect(validateEstimatedMinutes(1441).error).toBeTruthy();
    });

    it('requires integer', () => {
      expect(validateEstimatedMinutes(30.5).error).toBeTruthy();
    });
  });

  describe('validatePoints', () => {
    it('validates valid points', () => {
      expect(validatePoints(10)).toEqual({ isValid: true });
    });

    it('rejects out of range', () => {
      expect(validatePoints(0).error).toBeTruthy();
      expect(validatePoints(1001).error).toBeTruthy();
    });
  });

  describe('sanitizeText', () => {
    it('escapes HTML entities', () => {
      expect(sanitizeText('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('trims whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('handles empty string', () => {
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('sanitizeHTML', () => {
    it('strips HTML tags', () => {
      expect(sanitizeHTML('<p>Hello <strong>world</strong></p>')).toBe(
        'Hello world'
      );
    });

    it('handles empty string', () => {
      expect(sanitizeHTML('')).toBe('');
    });
  });

  describe('validateAvatar', () => {
    const allowed = ['😊', '😎', '🤓'];

    it('validates allowed avatar', () => {
      expect(validateAvatar('😊', allowed)).toEqual({ isValid: true });
    });

    it('rejects disallowed avatar', () => {
      expect(validateAvatar('👽', allowed).error).toBeTruthy();
    });

    it('rejects empty avatar', () => {
      expect(validateAvatar('', allowed).error).toBeTruthy();
    });
  });

  describe('validateIcon', () => {
    const allowed = ['🏠', '🏡', '🏘️'];

    it('validates allowed icon', () => {
      expect(validateIcon('🏠', allowed)).toEqual({ isValid: true });
    });

    it('rejects disallowed icon', () => {
      expect(validateIcon('🌟', allowed).error).toBeTruthy();
    });
  });

  describe('validateAll', () => {
    it('returns success when all valid', () => {
      expect(
        validateAll(
          { isValid: true },
          { isValid: true },
          { isValid: true }
        )
      ).toEqual({ isValid: true });
    });

    it('returns first error', () => {
      const result = validateAll(
        { isValid: true },
        { isValid: false, error: 'Error 1' },
        { isValid: false, error: 'Error 2' }
      );
      expect(result.error).toBe('Error 1');
    });

    it('handles empty array', () => {
      expect(validateAll()).toEqual({ isValid: true });
    });
  });
});
