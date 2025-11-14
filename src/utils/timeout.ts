/**
 * Timeout Utilities
 *
 * Utilities for adding timeouts to promises and operations.
 * Essential for preventing hung requests, managing long-running operations,
 * and implementing cancellation in Ethereum applications.
 *
 * @module utils/timeout
 */

import type { TimeoutOptions } from "./types.js";

/**
 * Timeout error class
 */
export class TimeoutError extends Error {
	constructor(message: string = "Operation timed out") {
		super(message);
		this.name = "TimeoutError";
	}
}

/**
 * Wrap a promise with a timeout
 *
 * Races the promise against a timeout. If the promise doesn't resolve
 * within the specified time, throws a TimeoutError. Supports AbortSignal
 * for cancellation.
 *
 * @template T - Promise result type
 * @param promise - Promise to add timeout to
 * @param options - Timeout configuration
 * @returns Promise that resolves to original result or throws TimeoutError
 * @throws TimeoutError if timeout is reached
 * @throws Error if AbortSignal is triggered
 *
 * @example
 * ```typescript
 * // Basic timeout
 * const result = await withTimeout(
 *   provider.eth_getBlockByNumber('latest'),
 *   { ms: 5000 }
 * );
 *
 * // Custom timeout message
 * const balance = await withTimeout(
 *   provider.eth_getBalance(address),
 *   {
 *     ms: 10000,
 *     message: 'Balance fetch timed out after 10s'
 *   }
 * );
 *
 * // With AbortController
 * const controller = new AbortController();
 * const dataPromise = withTimeout(
 *   fetchData(),
 *   { ms: 30000, signal: controller.signal }
 * );
 *
 * // Cancel operation
 * controller.abort();
 * ```
 */
export async function withTimeout<T>(
	promise: Promise<T>,
	options: TimeoutOptions,
): Promise<T> {
	const { ms, message = "Operation timed out", signal } = options;

	// Check if already aborted
	if (signal?.aborted) {
		throw new Error("Operation aborted");
	}

	return Promise.race([
		promise,
		new Promise<never>((_, reject) => {
			// Timeout timer
			const timeoutId = setTimeout(() => {
				reject(new TimeoutError(message));
			}, ms);

			// Clean up timeout when promise settles
			promise.finally(() => clearTimeout(timeoutId));

			// Handle abort signal
			if (signal) {
				signal.addEventListener("abort", () => {
					clearTimeout(timeoutId);
					reject(new Error("Operation aborted"));
				});
			}
		}),
	]);
}

/**
 * Create a timeout wrapper for a function
 *
 * Returns a new function that automatically adds a timeout to calls.
 * Useful for wrapping provider methods or other async functions.
 *
 * @template TArgs - Function argument types
 * @template TReturn - Function return type
 * @param fn - Function to wrap with timeout
 * @param ms - Timeout in milliseconds
 * @param message - Optional timeout message
 * @returns Function with automatic timeout
 *
 * @example
 * ```typescript
 * // Wrap provider method with timeout
 * const getBalanceWithTimeout = wrapWithTimeout(
 *   (address: string) => provider.eth_getBalance(address),
 *   5000
 * );
 *
 * const balance = await getBalanceWithTimeout('0x123...');
 *
 * // Wrap custom function
 * const fetchDataWithTimeout = wrapWithTimeout(
 *   async (url: string) => {
 *     const res = await fetch(url);
 *     return res.json();
 *   },
 *   10000,
 *   'Data fetch timeout'
 * );
 * ```
 */
export function wrapWithTimeout<TArgs extends any[], TReturn>(
	fn: (...args: TArgs) => Promise<TReturn>,
	ms: number,
	message?: string,
): (...args: TArgs) => Promise<TReturn> {
	return (...args: TArgs) =>
		withTimeout(fn(...args), {
			ms,
			message,
		});
}

/**
 * Sleep for specified duration with optional cancellation
 *
 * Returns a promise that resolves after the specified time.
 * Can be cancelled using an AbortSignal.
 *
 * @param ms - Milliseconds to sleep
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that resolves after delay
 * @throws Error if operation is aborted
 *
 * @example
 * ```typescript
 * // Simple delay
 * await sleep(1000); // Wait 1 second
 *
 * // Cancellable delay
 * const controller = new AbortController();
 * const sleepPromise = sleep(5000, controller.signal);
 *
 * // Cancel after 1 second
 * setTimeout(() => controller.abort(), 1000);
 *
 * try {
 *   await sleepPromise;
 * } catch (error) {
 *   console.log('Sleep cancelled');
 * }
 * ```
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		// Check if already aborted
		if (signal?.aborted) {
			reject(new Error("Operation aborted"));
			return;
		}

		const timeoutId = setTimeout(resolve, ms);

		// Handle abort signal
		if (signal) {
			signal.addEventListener("abort", () => {
				clearTimeout(timeoutId);
				reject(new Error("Operation aborted"));
			});
		}
	});
}

/**
 * Create a deferred promise with manual resolve/reject control
 *
 * Returns a promise along with functions to resolve or reject it manually.
 * Useful for complex async flows, event handling, and cancellation patterns.
 *
 * @template T - Promise result type
 * @returns Object with promise and control functions
 *
 * @example
 * ```typescript
 * // Manual promise control
 * const { promise, resolve, reject } = createDeferred<number>();
 *
 * // Resolve from event handler
 * provider.on('block', (blockNumber) => {
 *   if (blockNumber > 1000000) {
 *     resolve(blockNumber);
 *   }
 * });
 *
 * const result = await promise;
 *
 * // With timeout
 * const { promise, resolve, reject } = createDeferred<string>();
 * setTimeout(() => reject(new TimeoutError()), 5000);
 *
 * // Resolve from multiple sources
 * websocket.on('message', (data) => resolve(data));
 * controller.on('cancel', () => reject(new Error('Cancelled')));
 * ```
 */
export function createDeferred<T>(): {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (error: unknown) => void;
} {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

/**
 * Execute an async function with a timeout and optional retries
 *
 * Combines timeout and retry logic for robust async operations.
 * Each retry attempt gets a fresh timeout.
 *
 * @template T - Return type
 * @param fn - Async function to execute
 * @param timeoutMs - Timeout per attempt in milliseconds
 * @param maxRetries - Maximum number of retry attempts (default: 0)
 * @returns Promise resolving to function result
 * @throws TimeoutError if all attempts timeout
 *
 * @example
 * ```typescript
 * // Execute with timeout and retries
 * const block = await executeWithTimeout(
 *   () => provider.eth_getBlockByNumber('latest'),
 *   5000,  // 5s timeout per attempt
 *   3      // Retry up to 3 times
 * );
 *
 * // Fetch with timeout and retries
 * const data = await executeWithTimeout(
 *   async () => {
 *     const res = await fetch(url);
 *     return res.json();
 *   },
 *   10000,
 *   2
 * );
 * ```
 */
export async function executeWithTimeout<T>(
	fn: () => Promise<T>,
	timeoutMs: number,
	maxRetries: number = 0,
): Promise<T> {
	let lastError: unknown;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await withTimeout(fn(), { ms: timeoutMs });
		} catch (error) {
			lastError = error;

			// Don't retry if not a timeout error
			if (!(error instanceof TimeoutError) || attempt >= maxRetries) {
				throw error;
			}

			// Wait briefly before retry
			await sleep(100);
		}
	}

	// Should never reach here
	throw lastError;
}
