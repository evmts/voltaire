/**
 * Batch Processing Utilities
 *
 * Utilities for batching and queueing async operations.
 * Essential for optimizing RPC calls, reducing network overhead,
 * and managing concurrent operations in Ethereum applications.
 *
 * @module utils/batch
 */

import type { BatchQueueOptions } from "./types.js";

/**
 * Batch Queue for async operations
 *
 * Automatically batches items and processes them together when:
 * - Batch size reaches maxBatchSize
 * - maxWaitTime elapses since first item added
 *
 * Useful for batching RPC calls, database operations, or any async work.
 *
 * @template T - Item type
 * @template R - Result type
 *
 * @example
 * ```typescript
 * // Batch RPC calls
 * const queue = new BatchQueue({
 *   maxBatchSize: 10,
 *   maxWaitTime: 100,
 *   processBatch: async (addresses) => {
 *     // Batch call to get multiple balances
 *     return Promise.all(
 *       addresses.map(addr => provider.eth_getBalance(addr))
 *     );
 *   }
 * });
 *
 * // Add items - automatically batched
 * const balance1 = queue.add('0x123...');
 * const balance2 = queue.add('0x456...');
 * const balance3 = queue.add('0x789...');
 *
 * // Results returned individually
 * console.log(await balance1); // Balance for 0x123...
 * console.log(await balance2); // Balance for 0x456...
 * ```
 */
export class BatchQueue<T, R> {
	private readonly maxBatchSize: number;
	private readonly maxWaitTime: number;
	private readonly processBatch: (items: T[]) => Promise<R[]>;
	private readonly onError?: (error: unknown, items: T[]) => void;

	private queue: Array<{
		item: T;
		resolve: (value: R) => void;
		reject: (error: unknown) => void;
	}> = [];
	private timer: ReturnType<typeof setTimeout> | null = null;
	private processing = false;

	constructor(options: BatchQueueOptions<T, R>) {
		this.maxBatchSize = options.maxBatchSize;
		this.maxWaitTime = options.maxWaitTime;
		this.processBatch = options.processBatch;
		this.onError = options.onError;
	}

	/**
	 * Add an item to the queue
	 *
	 * @param item - Item to process
	 * @returns Promise resolving to the result for this item
	 */
	async add(item: T): Promise<R> {
		return new Promise<R>((resolve, reject) => {
			this.queue.push({ item, resolve, reject });

			// Start timer if this is first item
			if (this.queue.length === 1) {
				this.startTimer();
			}

			// Process immediately if batch is full
			if (this.queue.length >= this.maxBatchSize) {
				this.flush();
			}
		});
	}

	/**
	 * Start the batch timer
	 */
	private startTimer(): void {
		if (this.timer) {
			clearTimeout(this.timer);
		}

		this.timer = setTimeout(() => {
			this.flush();
		}, this.maxWaitTime);
	}

	/**
	 * Flush the current batch
	 */
	async flush(): Promise<void> {
		// Clear timer
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		// Nothing to process
		if (this.queue.length === 0 || this.processing) {
			return;
		}

		// Get current batch
		const batch = this.queue.splice(0, this.maxBatchSize);
		const items = batch.map((entry) => entry.item);

		this.processing = true;

		try {
			// Process batch
			const results = await this.processBatch(items);

			// Resolve individual promises
			// Safety: Loop bounds guarantee batch[i] exists (i < batch.length)
			// Contract: processBatch must return results.length === items.length
			for (let i = 0; i < batch.length; i++) {
				batch[i]!.resolve(results[i]!);
			}
		} catch (error) {
			// Notify error handler
			if (this.onError) {
				this.onError(error, items);
			}

			// Reject all promises in batch
			for (const entry of batch) {
				entry.reject(error);
			}
		} finally {
			this.processing = false;

			// Process remaining items if any
			if (this.queue.length > 0) {
				this.startTimer();

				// Flush immediately if batch is full
				if (this.queue.length >= this.maxBatchSize) {
					this.flush();
				}
			}
		}
	}

	/**
	 * Get current queue size
	 */
	size(): number {
		return this.queue.length;
	}

	/**
	 * Clear the queue without processing
	 */
	clear(): void {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		// Reject all pending items
		for (const entry of this.queue) {
			entry.reject(new Error("Queue cleared"));
		}

		this.queue = [];
	}

	/**
	 * Wait for all pending items to complete
	 */
	async drain(): Promise<void> {
		while (this.queue.length > 0 || this.processing) {
			await this.flush();
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	}
}

/**
 * Create a batched version of an async function
 *
 * Returns a new function that automatically batches calls.
 * Useful for wrapping provider methods or other async functions.
 *
 * @template T - Argument type
 * @template R - Return type
 * @param fn - Function to batch (takes array, returns array)
 * @param maxBatchSize - Maximum batch size
 * @param maxWaitTime - Maximum wait time in milliseconds
 * @returns Batched function (takes single item, returns single result)
 *
 * @example
 * ```typescript
 * // Batch balance lookups
 * const getBalance = createBatchedFunction(
 *   async (addresses: string[]) => {
 *     return Promise.all(
 *       addresses.map(addr => provider.eth_getBalance(addr))
 *     );
 *   },
 *   50,   // Batch up to 50 addresses
 *   100   // Wait max 100ms
 * );
 *
 * // Use like normal function - batching happens automatically
 * const balance1 = getBalance('0x123...');
 * const balance2 = getBalance('0x456...');
 * const balance3 = getBalance('0x789...');
 *
 * // All three requests batched into single call
 * console.log(await balance1);
 * console.log(await balance2);
 * console.log(await balance3);
 * ```
 */
export function createBatchedFunction<T, R>(
	fn: (items: T[]) => Promise<R[]>,
	maxBatchSize: number,
	maxWaitTime: number,
): (item: T) => Promise<R> {
	const queue = new BatchQueue<T, R>({
		maxBatchSize,
		maxWaitTime,
		processBatch: fn,
	});

	return (item: T) => queue.add(item);
}

/**
 * Async queue processor with concurrency limit
 *
 * Processes items from a queue with a maximum number of concurrent operations.
 * Useful for rate-limiting parallel operations like RPC calls or file I/O.
 *
 * @template T - Item type
 * @template R - Result type
 *
 * @example
 * ```typescript
 * // Process with max 3 concurrent operations
 * const processor = new AsyncQueue<string, Balance>(
 *   async (address) => provider.eth_getBalance(address),
 *   { concurrency: 3 }
 * );
 *
 * // Add items
 * const results = await Promise.all([
 *   processor.add('0x123...'),
 *   processor.add('0x456...'),
 *   processor.add('0x789...'),
 *   processor.add('0xabc...'),
 *   processor.add('0xdef...'),
 * ]);
 *
 * // Only 3 execute concurrently, others wait
 * ```
 */
export class AsyncQueue<T, R> {
	private readonly processFn: (item: T) => Promise<R>;
	private readonly concurrency: number;
	private queue: Array<{
		item: T;
		resolve: (value: R) => void;
		reject: (error: unknown) => void;
	}> = [];
	private active = 0;

	constructor(
		processFn: (item: T) => Promise<R>,
		options: { concurrency: number },
	) {
		this.processFn = processFn;
		this.concurrency = options.concurrency;
	}

	/**
	 * Add an item to the queue
	 *
	 * @param item - Item to process
	 * @returns Promise resolving to the result
	 */
	async add(item: T): Promise<R> {
		return new Promise<R>((resolve, reject) => {
			this.queue.push({ item, resolve, reject });
			this.process();
		});
	}

	/**
	 * Process items from queue
	 */
	private async process(): Promise<void> {
		if (this.active >= this.concurrency || this.queue.length === 0) {
			return;
		}

		this.active++;

		const entry = this.queue.shift();
		if (!entry) {
			this.active--;
			return;
		}

		try {
			const result = await this.processFn(entry.item);
			entry.resolve(result);
		} catch (error) {
			entry.reject(error);
		} finally {
			this.active--;
			this.process();
		}
	}

	/**
	 * Get current queue size
	 */
	size(): number {
		return this.queue.length;
	}

	/**
	 * Get number of active operations
	 */
	activeCount(): number {
		return this.active;
	}

	/**
	 * Wait for all operations to complete
	 */
	async drain(): Promise<void> {
		while (this.queue.length > 0 || this.active > 0) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	}
}
