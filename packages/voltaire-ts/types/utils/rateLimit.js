/**
 * Rate Limiting Utilities
 *
 * Utilities for rate limiting, throttling, and debouncing function calls.
 * Essential for managing API rate limits, preventing request spam, and
 * optimizing performance in Ethereum applications.
 *
 * @module utils/rateLimit
 */
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
export function throttle(fn, wait) {
    let lastCallTime = 0;
    let lastResult;
    return (...args) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime;
        if (timeSinceLastCall >= wait) {
            lastCallTime = now;
            lastResult = fn(...args);
            return lastResult;
        }
        return lastResult;
    };
}
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
export function debounce(fn, wait) {
    let timeoutId;
    const debounced = (...args) => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = undefined;
        }, wait);
    };
    debounced.cancel = () => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    };
    return debounced;
}
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
export class RateLimiter {
    maxRequests;
    interval;
    strategy;
    tokens;
    lastRefill;
    queue = [];
    processing = false;
    constructor(options) {
        this.maxRequests = options.maxRequests;
        this.interval = options.interval;
        this.strategy = options.strategy ?? "queue";
        this.tokens = options.maxRequests;
        this.lastRefill = Date.now();
    }
    /**
     * Refill tokens based on elapsed time
     */
    refill() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = (elapsed / this.interval) * this.maxRequests;
        if (tokensToAdd >= 1) {
            this.tokens = Math.min(this.maxRequests, this.tokens + Math.floor(tokensToAdd));
            this.lastRefill = now;
        }
    }
    /**
     * Process queued requests
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }
        this.processing = true;
        while (this.queue.length > 0) {
            this.refill();
            if (this.tokens < 1) {
                // Wait for next refill
                const waitTime = this.interval / this.maxRequests;
                await new Promise((resolve) => setTimeout(resolve, waitTime));
                continue;
            }
            const item = this.queue.shift();
            if (!item)
                break;
            this.tokens--;
            try {
                const result = await item.fn();
                item.resolve(result);
            }
            catch (error) {
                item.reject(error);
            }
        }
        this.processing = false;
    }
    /**
     * Execute a function with rate limiting
     *
     * @template T - Return type
     * @param fn - Async function to execute
     * @returns Promise resolving to function result
     * @throws Error if rate limit exceeded and strategy is 'reject'
     */
    async execute(fn) {
        this.refill();
        // If tokens available, execute immediately
        if (this.tokens >= 1) {
            this.tokens--;
            const result = await fn();
            // Process queue if exists
            if (this.queue.length > 0) {
                this.processQueue();
            }
            return result;
        }
        // No tokens available - apply strategy
        switch (this.strategy) {
            case "queue":
                return new Promise((resolve, reject) => {
                    this.queue.push({
                        fn: fn,
                        resolve: resolve,
                        reject,
                    });
                    this.processQueue();
                });
            case "reject":
                throw new Error(`Rate limit exceeded: ${this.maxRequests} requests per ${this.interval}ms`);
            case "drop":
                // Silently drop request
                return Promise.resolve(undefined);
        }
    }
    /**
     * Wrap a function with rate limiting
     *
     * @template TArgs - Function argument types
     * @template TReturn - Function return type
     * @param fn - Function to wrap
     * @returns Rate-limited function
     */
    wrap(fn) {
        return (...args) => this.execute(() => fn(...args));
    }
    /**
     * Get current token count
     */
    getTokens() {
        this.refill();
        return this.tokens;
    }
    /**
     * Get queued request count
     */
    getQueueLength() {
        return this.queue.length;
    }
    /**
     * Clear all queued requests
     */
    clearQueue() {
        this.queue = [];
    }
}
