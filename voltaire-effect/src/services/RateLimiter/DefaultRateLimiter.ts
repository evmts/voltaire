/**
 * @fileoverview Default implementation of RateLimiterService.
 *
 * @module DefaultRateLimiter
 * @since 0.0.1
 *
 * @description
 * Provides the default implementation layer for RateLimiterService.
 * Uses Effect's built-in RateLimiter for token-bucket or fixed-window rate limiting.
 *
 * @see {@link RateLimiterService} - The service interface
 */

import * as Effect from "effect/Effect";
import { compose } from "effect/Function";
import * as Layer from "effect/Layer";
import * as RateLimiter from "effect/RateLimiter";
import {
	RateLimitError,
	type RateLimiterConfig,
	RateLimiterService,
	type RateLimiterShape,
} from "./RateLimiterService.js";

const resolveInterval = (
	interval?: RateLimiter.RateLimiter.Options["interval"],
	window?: RateLimiter.RateLimiter.Options["interval"],
) => {
	const resolved = interval ?? window;
	if (!resolved) {
		throw new Error("RateLimiter config requires an interval/window value");
	}
	return resolved;
};

/**
 * Creates a RateLimiterShape from configuration.
 * This is the core factory that creates the rate limiting infrastructure.
 *
 * @internal
 */
const makeRateLimiterShape = (
	config: RateLimiterConfig,
	globalLimiter: RateLimiter.RateLimiter | undefined,
	methodLimiters: Map<string, RateLimiter.RateLimiter>,
): RateLimiterShape => {
	const behavior = config.behavior ?? config.onExceeded ?? "delay";

	const getLimiter = (method: string) => methodLimiters.get(method);
	const getGlobalLimiter = () => globalLimiter;

	const consume = (method: string, cost = 1) =>
		Effect.gen(function* () {
			const methodLimiter = methodLimiters.get(method);

			if (methodLimiter) {
				if (behavior === "fail") {
					const result = yield* methodLimiter(Effect.void).pipe(
						RateLimiter.withCost(cost),
						Effect.timeout(0),
						Effect.option,
					);
					if (result._tag === "None") {
						return yield* Effect.fail(
							new RateLimitError({
								method,
								message: `Rate limit exceeded for method: ${method}`,
							}),
						);
					}
				} else {
					yield* methodLimiter(Effect.void).pipe(RateLimiter.withCost(cost));
				}
			}

			if (globalLimiter) {
				if (behavior === "fail") {
					const result = yield* globalLimiter(Effect.void).pipe(
						RateLimiter.withCost(cost),
						Effect.timeout(0),
						Effect.option,
					);
					if (result._tag === "None") {
						return yield* Effect.fail(
							new RateLimitError({
								method,
								message: `Global rate limit exceeded for method: ${method}`,
							}),
						);
					}
				} else {
					yield* globalLimiter(Effect.void).pipe(RateLimiter.withCost(cost));
				}
			}
		});

	const withRateLimit = <A, E, R>(
		method: string,
		effect: Effect.Effect<A, E, R>,
	): Effect.Effect<A, E | RateLimitError, R> => {
		const methodLimiter = methodLimiters.get(method);

		if (behavior === "fail") {
			return Effect.gen(function* () {
				yield* consume(method);
				return yield* effect;
			});
		}

		let rateLimited = effect;
		if (methodLimiter && globalLimiter) {
			rateLimited = compose(methodLimiter, globalLimiter)(effect);
		} else if (methodLimiter) {
			rateLimited = methodLimiter(effect);
		} else if (globalLimiter) {
			rateLimited = globalLimiter(effect);
		}

		return rateLimited as Effect.Effect<A, E | RateLimitError, R>;
	};

	return {
		withRateLimit,
		consume,
		getLimiter,
		getGlobalLimiter,
		config,
	};
};

/**
 * Creates a scoped effect that builds the rate limiter infrastructure.
 *
 * @since 0.0.1
 */
export const makeRateLimiter = (config: RateLimiterConfig) =>
	Effect.gen(function* () {
		const globalLimiter = config.global
			? yield* RateLimiter.make({
					limit: config.global.limit,
					interval: resolveInterval(
						config.global.interval,
						config.global.window,
					),
					algorithm: config.global.algorithm,
				})
			: undefined;

		const methodLimiters = new Map<string, RateLimiter.RateLimiter>();

		if (config.methods) {
			for (const [method, opts] of Object.entries(config.methods)) {
				const limiter = yield* RateLimiter.make({
					limit: opts.limit,
					interval: resolveInterval(opts.interval, opts.window),
					algorithm: opts.algorithm,
				});
				methodLimiters.set(method, limiter);
			}
		}

		return makeRateLimiterShape(config, globalLimiter, methodLimiters);
	});

/**
 * Default implementation of the rate limiter layer.
 *
 * @description
 * Provides a concrete implementation of RateLimiterService that:
 * - Supports global rate limits across all methods
 * - Supports per-method rate limits
 * - Configurable "delay" or "fail" behavior when limits exceeded
 * - Uses Effect's built-in RateLimiter (token-bucket or fixed-window)
 *
 * @since 0.0.1
 *
 * @example Basic global limit
 * ```typescript
 * import { Effect } from 'effect'
 * import { DefaultRateLimiter, RateLimiterService } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const rateLimiter = yield* RateLimiterService
 *   yield* rateLimiter.consume("eth_call")
 * }).pipe(
 *   Effect.scoped,
 *   Effect.provide(DefaultRateLimiter({ global: { limit: 10, interval: "1 seconds" } }))
 * )
 * ```
 *
 * @example Per-method limits with fail behavior
 * ```typescript
 * const RateLimited = DefaultRateLimiter({
 *   methods: {
 *     "eth_getLogs": { limit: 5, interval: "1 seconds" },
 *     "eth_call": { limit: 50, interval: "1 seconds" }
 *   },
 *   behavior: "fail"
 * })
 * ```
 *
 * @see {@link RateLimiterService} - The service interface
 * @see {@link RateLimitError} - Error when limit exceeded with "fail" behavior
 */
export const DefaultRateLimiter = (
	config: RateLimiterConfig,
): Layer.Layer<RateLimiterService> =>
	Layer.scoped(RateLimiterService, makeRateLimiter(config));

/**
 * A no-op rate limiter that doesn't actually limit anything.
 * Useful for testing or when rate limiting should be disabled.
 *
 * @since 0.0.1
 */
export const NoopRateLimiter: Layer.Layer<RateLimiterService> = Layer.succeed(
	RateLimiterService,
	{
		withRateLimit: <A, E, R>(_method: string, effect: Effect.Effect<A, E, R>) =>
			effect as Effect.Effect<A, E | RateLimitError, R>,
		consume: () => Effect.void,
		getLimiter: () => undefined,
		getGlobalLimiter: () => undefined,
		config: {},
	},
);
