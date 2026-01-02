/**
 * Polling Utilities
 *
 * Utilities for polling operations with configurable intervals, backoff, and timeouts.
 * Essential for waiting on asynchronous operations in Ethereum applications like
 * transaction confirmations, block finalization, or contract state changes.
 *
 * @module utils/poll
 */

import type { PollOptions } from "./types.js";

/**
 * Default polling configuration
 */
const DEFAULT_POLL_OPTIONS: Required<
	Omit<PollOptions<unknown>, "validate" | "onPoll">
> = {
	interval: 1000,
	timeout: 60000,
	backoff: false,
	backoffFactor: 1.5,
	maxInterval: 10000,
};

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
 * Poll an async operation until it succeeds or times out
 *
 * Repeatedly calls the provided function until it returns a truthy value,
 * the optional validate predicate passes, or the timeout is reached.
 * Supports exponential backoff for progressively longer intervals.
 *
 * @template T - Return type of the polling function
 * @param fn - Async function to poll
 * @param options - Polling configuration
 * @returns Promise resolving to the successful result
 * @throws Error if timeout is reached or validation fails
 *
 * @example
 * ```typescript
 * // Wait for transaction confirmation
 * const receipt = await poll(
 *   () => provider.eth_getTransactionReceipt(txHash),
 *   {
 *     interval: 1000,
 *     timeout: 60000,
 *     validate: (receipt) => receipt !== null
 *   }
 * );
 *
 * // Wait for block with backoff
 * const block = await poll(
 *   () => provider.eth_getBlockByNumber('latest'),
 *   {
 *     interval: 500,
 *     backoff: true,
 *     backoffFactor: 2,
 *     maxInterval: 5000
 *   }
 * );
 *
 * // Poll with progress callback
 * const balance = await poll(
 *   () => provider.eth_getBalance(address),
 *   {
 *     interval: 2000,
 *     onPoll: (result, attempt) => {
 *       console.log(`Attempt ${attempt}: ${result}`);
 *     }
 *   }
 * );
 * ```
 */
export async function poll<T>(
	fn: () => Promise<T>,
	options: PollOptions<T> = {},
): Promise<T> {
	const config = {
		...DEFAULT_POLL_OPTIONS,
		...options,
	};

	const startTime = Date.now();
	let attempt = 0;
	let currentInterval = config.interval;

	while (true) {
		// Check timeout
		const elapsed = Date.now() - startTime;
		if (elapsed >= config.timeout) {
			throw new Error(`Polling timeout after ${config.timeout}ms`);
		}

		try {
			// Execute polling function
			const result = await fn();

			// Notify about poll
			if (config.onPoll) {
				config.onPoll(result, attempt);
			}

			// Check if result is valid
			const isValid = config.validate ? config.validate(result) : !!result;

			if (isValid) {
				return result;
			}
		} catch (_error) {
			// Continue polling on errors (operation may not be ready yet)
			// Errors will be thrown if timeout is reached
		}

		// Wait before next poll
		const remainingTime = config.timeout - (Date.now() - startTime);
		const waitTime = Math.min(currentInterval, remainingTime);

		if (waitTime > 0) {
			await sleep(waitTime);
		}

		// Apply backoff for next iteration
		if (config.backoff) {
			currentInterval = Math.min(
				currentInterval * config.backoffFactor,
				config.maxInterval,
			);
		}

		attempt++;
	}
}

/**
 * Poll until a predicate returns true
 *
 * Repeatedly calls the function and checks if the predicate passes.
 * More expressive than poll() when you want to explicitly check a condition.
 *
 * @template T - Return type of the polling function
 * @param fn - Async function to poll
 * @param predicate - Function to test result
 * @param options - Polling configuration (without validate)
 * @returns Promise resolving to the successful result
 * @throws Error if timeout is reached
 *
 * @example
 * ```typescript
 * // Wait for specific block number
 * const blockNumber = await pollUntil(
 *   () => provider.eth_blockNumber(),
 *   (num) => num >= 1000000n,
 *   { interval: 500, timeout: 30000 }
 * );
 *
 * // Wait for contract deployment
 * const code = await pollUntil(
 *   () => provider.eth_getCode(contractAddress),
 *   (code) => code.length > 2, // More than '0x'
 *   { interval: 1000 }
 * );
 * ```
 */
export async function pollUntil<T>(
	fn: () => Promise<T>,
	predicate: (result: T) => boolean,
	options: Omit<PollOptions<T>, "validate"> = {},
): Promise<T> {
	return poll(fn, {
		...options,
		validate: predicate,
	});
}

/**
 * Poll for a transaction receipt
 *
 * Convenience function for the common pattern of waiting for transaction confirmation.
 * Polls eth_getTransactionReceipt until receipt is available.
 *
 * @param txHash - Transaction hash to poll for
 * @param getReceipt - Function to fetch receipt (provider.eth_getTransactionReceipt)
 * @param options - Polling configuration
 * @returns Promise resolving to the transaction receipt
 * @throws Error if timeout is reached
 *
 * @example
 * ```typescript
 * // Wait for transaction receipt
 * const receipt = await pollForReceipt(
 *   txHash,
 *   (hash) => provider.eth_getTransactionReceipt(hash),
 *   { timeout: 120000 } // 2 minutes
 * );
 *
 * if (receipt.status === '0x1') {
 *   console.log('Transaction successful!');
 * }
 * ```
 */
export async function pollForReceipt<TReceipt>(
	txHash: string,
	getReceipt: (hash: string) => Promise<TReceipt | null>,
	options: Omit<PollOptions<TReceipt | null>, "validate"> = {},
): Promise<TReceipt> {
	const receipt = await poll(() => getReceipt(txHash), {
		interval: 1000,
		timeout: 60000,
		...options,
		validate: (receipt) => receipt !== null,
	});

	// TypeScript knows receipt is non-null here due to validate
	return receipt as TReceipt;
}

/**
 * Poll with exponential backoff
 *
 * Convenience function that enables exponential backoff by default.
 * Useful when you expect operations to take progressively longer.
 *
 * @template T - Return type of the polling function
 * @param fn - Async function to poll
 * @param options - Polling configuration (backoff enabled by default)
 * @returns Promise resolving to the successful result
 * @throws Error if timeout is reached
 *
 * @example
 * ```typescript
 * // Poll with automatic backoff
 * const data = await pollWithBackoff(
 *   () => provider.eth_call({ to, data }),
 *   {
 *     interval: 100,      // Start at 100ms
 *     backoffFactor: 2,   // Double each time
 *     maxInterval: 5000,  // Cap at 5s
 *     timeout: 30000
 *   }
 * );
 * ```
 */
export async function pollWithBackoff<T>(
	fn: () => Promise<T>,
	options: PollOptions<T> = {},
): Promise<T> {
	return poll(fn, {
		...options,
		backoff: true,
	});
}
