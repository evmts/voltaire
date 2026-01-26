/**
 * @fileoverview RateLimiter service definition for RPC rate limiting.
 *
 * @module RateLimiterService
 * @since 0.0.1
 *
 * @description
 * The RateLimiterService provides rate limiting for RPC calls to Ethereum nodes.
 * It supports per-method and global rate limits, with configurable behavior
 * when limits are exceeded (delay or fail).
 *
 * @see {@link DefaultRateLimiter} - The live implementation layer
 */

import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";
import type * as RateLimiter from "effect/RateLimiter";
import type * as Scope from "effect/Scope";

/**
 * Error thrown when rate limit is exceeded and behavior is set to "fail".
 *
 * @since 0.0.1
 */
export class RateLimitError extends Data.TaggedError("RateLimitError")<{
	readonly method: string;
	readonly message: string;
}> {}

/**
 * Behavior when rate limit is exceeded.
 * - "delay": Wait until capacity is available (default)
 * - "fail": Immediately fail with RateLimitError
 *
 * @since 0.0.1
 */
export type RateLimitBehavior = "delay" | "fail";

/**
 * Configuration for rate limiting.
 *
 * @since 0.0.1
 */
export type RateLimiterConfig = {
	/**
	 * Global rate limit (requests per interval).
	 * Applied to all methods.
	 */
	readonly global?: {
		readonly limit: number;
		readonly interval: RateLimiter.RateLimiter.Options["interval"];
		readonly algorithm?: RateLimiter.RateLimiter.Options["algorithm"];
	};

	/**
	 * Per-method rate limits.
	 * Keys are RPC method names (e.g., "eth_call", "eth_getLogs").
	 */
	readonly methods?: Record<
		string,
		{
			readonly limit: number;
			readonly interval: RateLimiter.RateLimiter.Options["interval"];
			readonly algorithm?: RateLimiter.RateLimiter.Options["algorithm"];
		}
	>;

	/**
	 * Behavior when rate limit is exceeded.
	 * @default "delay"
	 */
	readonly behavior?: RateLimitBehavior;
};

/**
 * Shape of the rate limiter service.
 *
 * @since 0.0.1
 */
export type RateLimiterShape = {
	/**
	 * Wraps an effect with rate limiting for a specific method.
	 *
	 * @param method - The RPC method name
	 * @param effect - The effect to rate limit
	 * @returns The rate-limited effect
	 */
	readonly withRateLimit: <A, E, R>(
		method: string,
		effect: Effect.Effect<A, E, R>,
	) => Effect.Effect<A, E | RateLimitError, R>;

	/**
	 * Consumes rate limit capacity for a method.
	 * Use this before making an RPC call when you want explicit control.
	 *
	 * @param method - The RPC method name
	 * @param cost - Optional cost (default: 1)
	 * @returns Effect that resolves when capacity is available (or fails)
	 */
	readonly consume: (
		method: string,
		cost?: number,
	) => Effect.Effect<void, RateLimitError>;

	/**
	 * Gets the underlying rate limiter for a method.
	 * Returns undefined if no limiter is configured for the method.
	 *
	 * @param method - The RPC method name
	 */
	readonly getLimiter: (
		method: string,
	) => RateLimiter.RateLimiter | undefined;

	/**
	 * Gets the global rate limiter.
	 * Returns undefined if no global limiter is configured.
	 */
	readonly getGlobalLimiter: () => RateLimiter.RateLimiter | undefined;

	/**
	 * The current configuration.
	 */
	readonly config: RateLimiterConfig;
};

/**
 * RateLimiter service for RPC rate limiting.
 *
 * @description
 * Provides methods for rate limiting RPC calls to Ethereum nodes.
 * Supports both global and per-method rate limits.
 *
 * @since 0.0.1
 *
 * @example Basic usage with withRateLimit
 * ```typescript
 * import { Effect } from 'effect'
 * import { RateLimiterService, DefaultRateLimiter } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const rateLimiter = yield* RateLimiterService
 *   const transport = yield* TransportService
 *
 *   // Automatically rate-limited
 *   return yield* rateLimiter.withRateLimit(
 *     "eth_call",
 *     transport.request("eth_call", params)
 *   )
 * }).pipe(
 *   Effect.scoped,
 *   Effect.provide(DefaultRateLimiter({ global: { limit: 10, interval: "1 seconds" } }))
 * )
 * ```
 *
 * @example Manual consume pattern
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const rateLimiter = yield* RateLimiterService
 *   const transport = yield* TransportService
 *
 *   // Manual rate limit check
 *   yield* rateLimiter.consume("eth_call")
 *   return yield* transport.request("eth_call", params)
 * })
 * ```
 *
 * @example Per-method limits
 * ```typescript
 * const RateLimited = DefaultRateLimiter({
 *   global: { limit: 100, interval: "1 seconds" },
 *   methods: {
 *     "eth_getLogs": { limit: 5, interval: "1 seconds" },
 *     "eth_call": { limit: 50, interval: "1 seconds" }
 *   },
 *   behavior: "fail" // Fail fast instead of waiting
 * })
 * ```
 *
 * @see {@link DefaultRateLimiter} - The live implementation layer
 * @see {@link RateLimitError} - Error type when limit exceeded
 */
export class RateLimiterService extends Context.Tag("RateLimiterService")<
	RateLimiterService,
	RateLimiterShape
>() {}

/**
 * Creates a scoped RateLimiter layer with the given configuration.
 * The rate limiters are scoped and will be cleaned up when the scope closes.
 *
 * @since 0.0.1
 */
export type MakeRateLimiter = (
	config: RateLimiterConfig,
) => Effect.Effect<RateLimiterShape, never, Scope.Scope>;
