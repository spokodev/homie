import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  isNetworkError?: boolean;
  isAuthError?: boolean;
}

/**
 * Parse Supabase errors into user-friendly messages
 */
export function parseSupabaseError(error: any): AppError {
  // Network errors
  if (error.message === 'Failed to fetch' || error.message?.includes('network')) {
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      isNetworkError: true,
      details: error,
    };
  }

  // Auth errors
  if (error.message?.includes('Invalid login credentials')) {
    return {
      message: 'Invalid email or password',
      code: 'INVALID_CREDENTIALS',
      isAuthError: true,
      details: error,
    };
  }

  if (error.message?.includes('Email not confirmed')) {
    return {
      message: 'Please verify your email before logging in',
      code: 'EMAIL_NOT_CONFIRMED',
      isAuthError: true,
      details: error,
    };
  }

  if (error.message?.includes('User already registered')) {
    return {
      message: 'This email is already registered',
      code: 'USER_EXISTS',
      isAuthError: true,
      details: error,
    };
  }

  // Database errors
  if (error.code === 'PGRST116') {
    return {
      message: 'Not found',
      code: 'NOT_FOUND',
      details: error,
    };
  }

  if (error.code?.startsWith('23')) {
    // PostgreSQL constraint violations
    return {
      message: 'Invalid data. Please check your input.',
      code: 'VALIDATION_ERROR',
      details: error,
    };
  }

  // Permission errors
  if (error.code === '42501' || error.message?.includes('permission')) {
    return {
      message: 'You don\'t have permission to perform this action',
      code: 'PERMISSION_DENIED',
      details: error,
    };
  }

  // Default error
  return {
    message: error.message || 'An unexpected error occurred',
    code: error.code || 'UNKNOWN_ERROR',
    details: error,
  };
}

/**
 * Show error alert to user
 */
export function showErrorAlert(error: any, title: string = 'Error') {
  const appError = parseSupabaseError(error);

  Alert.alert(title, appError.message, [
    {
      text: 'OK',
      style: 'default',
    },
  ]);
}

/**
 * Log error for debugging and send to Sentry
 */
export function logError(error: any, context?: string) {
  const appError = parseSupabaseError(error);

  console.error(`[${context || 'Error'}]`, {
    message: appError.message,
    code: appError.code,
    details: appError.details,
    timestamp: new Date().toISOString(),
  });

  // Send to Sentry in production
  if (!__DEV__) {
    Sentry.captureException(error, {
      tags: {
        context: context || 'unknown',
        errorCode: appError.code || 'unknown',
      },
      extra: {
        appError: appError,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Handle React Query errors
 */
export function handleQueryError(error: any, context?: string) {
  logError(error, context);

  const appError = parseSupabaseError(error);

  // Don't show alert for not found errors (they're expected sometimes)
  if (appError.code === 'NOT_FOUND') return;

  // Show user-friendly error
  showErrorAlert(error, 'Oops!');
}

/**
 * Retry logic for mutations
 */
export function shouldRetry(failureCount: number, error: any): boolean {
  // Don't retry auth errors
  const appError = parseSupabaseError(error);
  if (appError.isAuthError) return false;

  // Don't retry validation errors
  if (appError.code === 'VALIDATION_ERROR') return false;

  // Retry network errors up to 3 times
  if (appError.isNetworkError && failureCount < 3) return true;

  // Retry other errors once
  return failureCount < 1;
}
