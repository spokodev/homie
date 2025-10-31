import { measureAsync as measureTransaction } from './performance';

/**
 * Performance utilities for optimizing app performance
 */

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to ensure a function is called at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize expensive function calls
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Measure the execution time of an async function
 */
export async function measureAsync<T>(
  name: string,
  func: () => Promise<T>
): Promise<T> {
  return measureTransaction(name, func);
}

/**
 * Batch multiple async operations together
 */
export async function batchAsync<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((op) => op()));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  func: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await func();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Cache wrapper for expensive computations
 */
export class CacheManager<K, V> {
  private cache: Map<K, { value: V; timestamp: number }>;
  private ttl: number;

  constructor(ttlMinutes: number = 5) {
    this.cache = new Map();
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Lazy load a component with error boundary
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(importFunc);
}

/**
 * Check if we should prefetch data based on network conditions
 */
export function shouldPrefetch(): boolean {
  // @ts-ignore - navigator.connection is not in TypeScript types
  const connection = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;

  if (!connection) return true; // Default to true if API not available

  // Don't prefetch on slow connections or when save-data is enabled
  if (connection.saveData) return false;
  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    return false;
  }

  return true;
}

/**
 * Image optimization helper
 */
export function getOptimizedImageUri(uri: string, _width?: number, _quality?: number): string {
  // For remote images, you could add query params for optimization
  // For now, just return the URI as-is
  // In production, you might use a CDN with image optimization
  return uri;
}

/**
 * Check if device has enough memory for heavy operations
 */
export function hasEnoughMemory(): boolean {
  // @ts-ignore
  const memory = navigator?.deviceMemory;

  if (!memory) return true; // Assume true if API not available

  return memory >= 4; // 4GB or more
}

/**
 * Virtual list helper - calculate visible items
 */
export function calculateVisibleItems(
  scrollOffset: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number
): { startIndex: number; endIndex: number; visibleCount: number } {
  const startIndex = Math.floor(scrollOffset / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, totalItems);

  return { startIndex, endIndex, visibleCount };
}

// React import for lazyLoad
import React from 'react';
