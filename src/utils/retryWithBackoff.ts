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
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<
	Omit<RetryOptions, "shouldRetry" | "onRetry">
> = {
	maxRetries: 3,
	initialDelay: 1000,
	factor: 2,
	maxDelay: 30000,
	jitter: true,
};

/**
 * Calculate delay with exponential backoff
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param options - Retry configuration
 * @returns Delay in milliseconds
 */
function calculateDelay(
	attempt: number,
	options: Required<Omit<RetryOptions, "shouldRetry" | "onRetry">>,
): number {
	// Calculate exponential delay: initialDelay * factor^attempt
	const exponentialDelay =
		options.initialDelay * Math.pow(options.factor, attempt);

	// Cap at maxDelay
	let delay = Math.min(exponentialDelay, options.maxDelay);

	// Add jitter if enabled (randomize between 80% and 120% of calculated delay)
	if (options.jitter) {
		const jitterFactor = 0.8 + Math.random() * 0.4; // Random value between 0.8 and 1.2
		delay = Math.floor(delay * jitterFactor);
	}

	return delay;
}

/**
 * Sleep for specified duration
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

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
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	// Merge with defaults
	const config = {
		...DEFAULT_RETRY_OPTIONS,
		...options,
	};

	let lastError: unknown;

	for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Check if we should retry this error
			if (config.shouldRetry && !config.shouldRetry(error, attempt)) {
				throw error;
			}

			// Don't retry if we've exhausted all attempts
			if (attempt >= config.maxRetries) {
				throw error;
			}

			// Calculate delay for next attempt
			const delay = calculateDelay(attempt, config);

			// Notify about retry
			if (config.onRetry) {
				config.onRetry(error, attempt + 1, delay);
			}

			// Wait before retrying
			await sleep(delay);
		}
	}

	// Should never reach here, but TypeScript needs it
	throw lastError;
}

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
export function withRetry<TArgs extends any[], TReturn>(
	fn: (...args: TArgs) => Promise<TReturn>,
	options: RetryOptions = {},
): (...args: TArgs) => Promise<TReturn> {
	return (...args: TArgs) => retryWithBackoff(() => fn(...args), options);
}
