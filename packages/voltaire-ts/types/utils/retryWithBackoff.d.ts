/**
 * Retry with Exponential Backoff
 *
 * Utility for retrying failed operations with exponential backoff and optional jitter.
 * Essential for handling transient failures in network requests, RPC calls, and other
 * unreliable operations common in Ethereum applications.
 *
 * @module utils/retryWithBackoff
 */
import type { RetryOptions } from "./types.js";
/**
 * Retry an async operation with exponential backoff
 *
 * Automatically retries failed operations using exponential backoff with jitter.
 * Useful for handling transient failures in network requests, RPC calls, and
 * other unreliable operations.
 *
 * @template T - Return type of the operation
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Promise resolving to the operation result
 * @throws Last error encountered if all retries exhausted
 *
 * @example
 * ```typescript
 * // Basic usage - retry RPC call
 * const blockNumber = await retryWithBackoff(
 *   () => provider.eth_blockNumber(),
 *   { maxRetries: 5 }
 * );
 *
 * // Custom retry condition - only retry on network errors
 * const data = await retryWithBackoff(
 *   () => fetchData(),
 *   {
 *     maxRetries: 3,
 *     shouldRetry: (error) => error.code === 'NETWORK_ERROR',
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
 *     }
 *   }
 * );
 *
 * // Aggressive retry with custom backoff
 * const result = await retryWithBackoff(
 *   () => unstableOperation(),
 *   {
 *     maxRetries: 10,
 *     initialDelay: 100,
 *     factor: 1.5,
 *     maxDelay: 5000,
 *     jitter: true
 *   }
 * );
 * ```
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Create a retry wrapper for a function
 *
 * Returns a new function that automatically retries with the given configuration.
 * Useful for wrapping provider methods or other frequently-called functions.
 *
 * @template TArgs - Function argument types
 * @template TReturn - Function return type
 * @param fn - Function to wrap with retry logic
 * @param options - Retry configuration
 * @returns Wrapped function with automatic retry
 *
 * @example
 * ```typescript
 * // Wrap provider method with automatic retry
 * const getBlockNumberWithRetry = withRetry(
 *   (provider: Provider) => provider.eth_blockNumber(),
 *   { maxRetries: 5, initialDelay: 500 }
 * );
 *
 * const blockNumber = await getBlockNumberWithRetry(provider);
 *
 * // Wrap custom function
 * const fetchWithRetry = withRetry(
 *   async (url: string) => {
 *     const res = await fetch(url);
 *     if (!res.ok) throw new Error('Request failed');
 *     return res.json();
 *   },
 *   { maxRetries: 3 }
 * );
 *
 * const data = await fetchWithRetry('https://api.example.com/data');
 * ```
 */
export declare function withRetry<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>, options?: RetryOptions): (...args: TArgs) => Promise<TReturn>;
//# sourceMappingURL=retryWithBackoff.d.ts.map