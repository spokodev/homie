import * as Sentry from '@sentry/react-native';

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string): Sentry.Transaction | null {
  if (__DEV__) {
    console.log(`[Performance] Start transaction: ${name} (${op})`);
    return null;
  }

  try {
    return Sentry.startTransaction({
      name,
      op,
    });
  } catch (error) {
    console.error('[Performance] Failed to start transaction:', error);
    return null;
  }
}

/**
 * Finish a performance transaction
 */
export function finishTransaction(transaction: Sentry.Transaction | null) {
  if (!transaction) return;

  try {
    transaction.finish();
  } catch (error) {
    console.error('[Performance] Failed to finish transaction:', error);
  }
}

/**
 * Create a performance span within a transaction
 */
export function startSpan(
  transaction: Sentry.Transaction | null,
  op: string,
  description: string
): Sentry.Span | null {
  if (!transaction) return null;

  try {
    return transaction.startChild({
      op,
      description,
    });
  } catch (error) {
    console.error('[Performance] Failed to start span:', error);
    return null;
  }
}

/**
 * Finish a performance span
 */
export function finishSpan(span: Sentry.Span | null) {
  if (!span) return;

  try {
    span.finish();
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
      if (transaction && status) {
        transaction.setHttpStatus(status);
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
