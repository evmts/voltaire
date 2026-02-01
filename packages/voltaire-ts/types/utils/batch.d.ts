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
export declare class BatchQueue<T, R> {
    private readonly maxBatchSize;
    private readonly maxWaitTime;
    private readonly processBatch;
    private readonly onError?;
    private queue;
    private timer;
    private processing;
    constructor(options: BatchQueueOptions<T, R>);
    /**
     * Add an item to the queue
     *
     * @param item - Item to process
     * @returns Promise resolving to the result for this item
     */
    add(item: T): Promise<R>;
    /**
     * Start the batch timer
     */
    private startTimer;
    /**
     * Flush the current batch
     */
    flush(): Promise<void>;
    /**
     * Get current queue size
     */
    size(): number;
    /**
     * Clear the queue without processing
     */
    clear(): void;
    /**
     * Wait for all pending items to complete
     */
    drain(): Promise<void>;
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
export declare function createBatchedFunction<T, R>(fn: (items: T[]) => Promise<R[]>, maxBatchSize: number, maxWaitTime: number): (item: T) => Promise<R>;
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
export declare class AsyncQueue<T, R> {
    private readonly processFn;
    private readonly concurrency;
    private queue;
    private active;
    constructor(processFn: (item: T) => Promise<R>, options: {
        concurrency: number;
    });
    /**
     * Add an item to the queue
     *
     * @param item - Item to process
     * @returns Promise resolving to the result
     */
    add(item: T): Promise<R>;
    /**
     * Process items from queue
     */
    private process;
    /**
     * Get current queue size
     */
    size(): number;
    /**
     * Get number of active operations
     */
    activeCount(): number;
    /**
     * Wait for all operations to complete
     */
    drain(): Promise<void>;
}
//# sourceMappingURL=batch.d.ts.map