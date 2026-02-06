/**
 * Utility Types
 *
 * Common type definitions for utility functions
 *
 * @module utils/types
 */

/**
 * Retry configuration options
 */
export interface RetryOptions {
	/** Maximum number of retry attempts (default: 3) */
	maxRetries?: number;
	/** Initial delay in milliseconds (default: 1000) */
	initialDelay?: number;
	/** Exponential backoff factor (default: 2) */
	factor?: number;
	/** Maximum delay cap in milliseconds (default: 30000) */
	maxDelay?: number;
	/** Add random jitter to delays (default: true) */
	jitter?: boolean;
	/** Predicate to determine if error should be retried (default: always retry) */
	shouldRetry?: (error: unknown, attempt: number) => boolean;
	/** Callback invoked on each retry attempt */
	onRetry?: (error: unknown, attempt: number, nextDelay: number) => void;
}

/**
 * Polling configuration options
 */
export interface PollOptions<T> {
	/** Polling interval in milliseconds (default: 1000) */
	interval?: number;
	/** Maximum polling duration in milliseconds (default: 60000) */
	timeout?: number;
	/** Use exponential backoff for polling intervals (default: false) */
	backoff?: boolean;
	/** Backoff factor when backoff enabled (default: 1.5) */
	backoffFactor?: number;
	/** Maximum interval when using backoff (default: 10000) */
	maxInterval?: number;
	/** Predicate to determine if polling should continue */
	validate?: (result: T) => boolean;
	/** Callback invoked on each poll attempt */
	onPoll?: (result: T, attempt: number) => void;
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterOptions {
	/** Maximum number of requests per interval */
	maxRequests: number;
	/** Time interval in milliseconds */
	interval: number;
	/** Queue strategy when limit exceeded (default: 'queue') */
	strategy?: "queue" | "reject" | "drop";
}

/**
 * Batch queue configuration
 */
export interface BatchQueueOptions<T, R> {
	/** Maximum batch size */
	maxBatchSize: number;
	/** Maximum wait time before flushing batch (ms) */
	maxWaitTime: number;
	/** Function to process a batch of items */
	processBatch: (items: T[]) => Promise<R[]>;
	/** Callback on batch processing error */
	onError?: (error: unknown, items: T[]) => void;
}

/**
 * Timeout options
 */
export interface TimeoutOptions {
	/** Timeout duration in milliseconds */
	ms: number;
	/** Error message for timeout (default: "Operation timed out") */
	message?: string;
	/** Optional AbortController for cancellation */
	signal?: AbortSignal;
}
