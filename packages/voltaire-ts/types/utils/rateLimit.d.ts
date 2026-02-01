/**
 * Rate Limiting Utilities
 *
 * Utilities for rate limiting, throttling, and debouncing function calls.
 * Essential for managing API rate limits, preventing request spam, and
 * optimizing performance in Ethereum applications.
 *
 * @module utils/rateLimit
 */
import type { RateLimiterOptions } from "./types.js";
/**
 * Throttle a function to execute at most once per specified wait time
 *
 * The first call executes immediately, subsequent calls within the wait
 * period are ignored. Useful for rate-limiting user actions or events.
 *
 * @template TArgs - Function argument types
 * @template TReturn - Function return type
 * @param fn - Function to throttle
 * @param wait - Wait time in milliseconds
 * @returns Throttled function
 *
 * @example
 * ```typescript
 * // Throttle RPC calls
 * const getBalance = throttle(
 *   (address: string) => provider.eth_getBalance(address),
 *   1000 // Max once per second
 * );
 *
 * // Multiple rapid calls - only first executes
 * getBalance('0x123...'); // Executes immediately
 * getBalance('0x456...'); // Ignored (within 1s)
 * getBalance('0x789...'); // Ignored (within 1s)
 * ```
 */
export declare function throttle<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => TReturn, wait: number): (...args: TArgs) => TReturn | undefined;
/**
 * Debounce a function to execute only after calls have stopped for specified wait time
 *
 * Delays execution until the function hasn't been called for the wait period.
 * Useful for expensive operations triggered by rapid events (search, resize, etc).
 *
 * @template TArgs - Function argument types
 * @template TReturn - Function return type
 * @param fn - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function with cancel method
 *
 * @example
 * ```typescript
 * // Debounce search queries
 * const searchBlocks = debounce(
 *   (query: string) => provider.eth_getBlockByNumber(query),
 *   500 // Wait 500ms after last keystroke
 * );
 *
 * // Rapid calls - only last executes after 500ms
 * searchBlocks('latest');  // Cancelled
 * searchBlocks('pending'); // Cancelled
 * searchBlocks('0x123');   // Executes after 500ms
 *
 * // Cancel pending execution
 * searchBlocks.cancel();
 * ```
 */
export declare function debounce<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => TReturn, wait: number): ((...args: TArgs) => void) & {
    cancel: () => void;
};
/**
 * Token Bucket Rate Limiter
 *
 * Implements token bucket algorithm for rate limiting. Requests consume tokens
 * from a bucket that refills over time. When bucket is empty, requests are queued,
 * rejected, or dropped based on strategy.
 *
 * @example
 * ```typescript
 * // Limit to 10 requests per second
 * const limiter = new RateLimiter({
 *   maxRequests: 10,
 *   interval: 1000,
 *   strategy: 'queue'
 * });
 *
 * // Execute with rate limit
 * const result = await limiter.execute(() => provider.eth_blockNumber());
 *
 * // Wrap function with rate limiter
 * const getBalance = limiter.wrap(
 *   (address: string) => provider.eth_getBalance(address)
 * );
 * const balance = await getBalance('0x123...');
 * ```
 */
export declare class RateLimiter {
    private readonly maxRequests;
    private readonly interval;
    private readonly strategy;
    private tokens;
    private lastRefill;
    private queue;
    private processing;
    constructor(options: RateLimiterOptions);
    /**
     * Refill tokens based on elapsed time
     */
    private refill;
    /**
     * Process queued requests
     */
    private processQueue;
    /**
     * Execute a function with rate limiting
     *
     * @template T - Return type
     * @param fn - Async function to execute
     * @returns Promise resolving to function result
     * @throws Error if rate limit exceeded and strategy is 'reject'
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Wrap a function with rate limiting
     *
     * @template TArgs - Function argument types
     * @template TReturn - Function return type
     * @param fn - Function to wrap
     * @returns Rate-limited function
     */
    wrap<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>): (...args: TArgs) => Promise<TReturn>;
    /**
     * Get current token count
     */
    getTokens(): number;
    /**
     * Get queued request count
     */
    getQueueLength(): number;
    /**
     * Clear all queued requests
     */
    clearQueue(): void;
}
//# sourceMappingURL=rateLimit.d.ts.map