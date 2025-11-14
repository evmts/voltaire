/**
 * Utilities
 *
 * Generic utilities for building robust Ethereum applications.
 * Includes retry logic, rate limiting, polling, timeouts, and batching.
 *
 * @module utils
 */

// Types
export type {
	RetryOptions,
	PollOptions,
	RateLimiterOptions,
	BatchQueueOptions,
	TimeoutOptions,
} from "./types.js";

// Retry with exponential backoff
export { retryWithBackoff, withRetry } from "./retryWithBackoff.js";

// Rate limiting
export { throttle, debounce, RateLimiter } from "./rateLimit.js";

// Polling
export {
	poll,
	pollUntil,
	pollForReceipt,
	pollWithBackoff,
} from "./poll.js";

// Timeout utilities
export {
	withTimeout,
	wrapWithTimeout,
	sleep,
	createDeferred,
	executeWithTimeout,
	TimeoutError,
} from "./timeout.js";

// Batch processing
export {
	BatchQueue,
	createBatchedFunction,
	AsyncQueue,
} from "./batch.js";
