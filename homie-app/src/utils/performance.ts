import * as Sentry from '@sentry/react-native';

// Type for transaction (compatible with both v4 and v5)
type SentryTransaction = any;

/**
 * Start a performance transaction
 * Note: Sentry v5 deprecated startTransaction in favor of startSpan
 * This is wrapped for backwards compatibility
 */
export function startTransaction(name: string, op: string): SentryTransaction | null {
  if (__DEV__) {
    console.log(`[Performance] Start transaction: ${name} (${op})`);
    return null;
  }

  try {
    // Try new API first (v5+), fallback to old API (v4)
    if (typeof Sentry.startSpan === 'function') {
      return null; // v5 uses a different pattern, disable for now
    }

    // Sentry v4 API - startTransaction was removed in v5
    // @ts-expect-error - startTransaction exists in v4 but not in v5 types
    if (typeof Sentry.startTransaction === 'function') {
      // @ts-expect-error - startTransaction exists in v4 but not in v5 types
      return Sentry.startTransaction({
        name,
        op,
      });
    }

    return null;
  } catch (error) {
    console.error('[Performance] Failed to start transaction:', error);
    return null;
  }
}

/**
 * Finish a performance transaction
 */
export function finishTransaction(transaction: SentryTransaction | null) {
  if (!transaction) return;

  try {
    if (typeof transaction.finish === 'function') {
      transaction.finish();
    }
  } catch (error) {
    console.error('[Performance] Failed to finish transaction:', error);
  }
}

/**
 * Create a performance span within a transaction
 */
export function startSpan(
  transaction: SentryTransaction | null,
  op: string,
  description: string
): any | null {
  if (!transaction) return null;

  try {
    if (typeof transaction.startChild === 'function') {
      return transaction.startChild({
        op,
        description,
      });
    }
    return null;
  } catch (error) {
    console.error('[Performance] Failed to start span:', error);
    return null;
  }
}

/**
 * Finish a performance span
 */
export function finishSpan(span: any | null) {
  if (!span) return;

  try {
    if (typeof span.finish === 'function') {
      span.finish();
    }
  } catch (error) {
    console.error('[Performance] Failed to finish span:', error);
  }
}

/**
 * Measure a function's execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(name, 'function');
  const start = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - start;

    if (__DEV__) {
      console.log(`[Performance] ${name} took ${duration}ms`);
    }

    return result;
  } finally {
    finishTransaction(transaction);
  }
}

/**
 * Track screen load time
 */
export function trackScreenLoad(screenName: string) {
  const transaction = startTransaction(`Screen: ${screenName}`, 'navigation');

  return {
    finish: () => finishTransaction(transaction),
  };
}

/**
 * Track API request time
 */
export function trackAPIRequest(endpoint: string, method: string = 'GET') {
  const transaction = startTransaction(`API: ${method} ${endpoint}`, 'http.request');

  return {
    finish: (status?: number) => {
      if (transaction && status && typeof transaction.setHttpStatus === 'function') {
        try {
          transaction.setHttpStatus(status);
        } catch (e) {
          // Ignore if method doesn't exist
        }
      }
      finishTransaction(transaction);
    },
  };
}

/**
 * Set performance context
 */
export function setPerformanceContext(key: string, value: any) {
  try {
    Sentry.setContext(key, value);
  } catch (error) {
    console.error('[Performance] Failed to set context:', error);
  }
}
