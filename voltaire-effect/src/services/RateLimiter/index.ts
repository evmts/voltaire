/**
 * @fileoverview RateLimiter module exports for RPC rate limiting.
 *
 * @module RateLimiter
 * @since 0.0.1
 *
 * @description
 * This module provides the rate limiter service for controlling RPC call rates
 * to Ethereum nodes. It includes the service definition, layer implementation,
 * and all related types.
 *
 * Main exports:
 * - {@link RateLimiterService} - The service tag/interface
 * - {@link DefaultRateLimiter} - The live implementation layer factory
 * - {@link NoopRateLimiter} - A no-op layer for testing
 * - {@link RateLimitError} - Error type when limit exceeded
 *
 * @example Typical usage
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   RateLimiterService,
 *   DefaultRateLimiter,
 *   TransportService
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const rateLimiter = yield* RateLimiterService
 *   const transport = yield* TransportService
 *
 *   return yield* rateLimiter.withRateLimit(
 *     "eth_call",
 *     transport.request("eth_call", params)
 *   )
 * }).pipe(
 *   Effect.scoped,
 *   Effect.provide(DefaultRateLimiter({ global: { limit: 10, interval: "1 seconds" } })),
 *   Effect.provide(HttpTransport('https://...'))
 * )
 * ```
 */

export {
	DefaultRateLimiter,
	makeRateLimiter,
	NoopRateLimiter,
} from "./DefaultRateLimiter.js";
export {
	RateLimitError,
	type RateLimitBehavior,
	type RateLimiterConfig,
	RateLimiterService,
	type RateLimiterShape,
} from "./RateLimiterService.js";
