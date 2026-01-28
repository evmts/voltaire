/**
 * @fileoverview FiberRef-based scoped transport configuration.
 *
 * @module TransportConfigFiberRef
 * @since 0.0.1
 *
 * @description
 * Provides FiberRefs and helpers for per-request transport overrides.
 * These overrides are scoped to the current fiber and do not leak to
 * other fibers.
 *
 * Uses Effect-native types:
 * - `timeout`: Effect Duration (e.g., `"5 seconds"`, `Duration.seconds(5)`)
 * - `retrySchedule`: Effect Schedule for retry behavior
 *
 * @example
 * ```typescript
 * import { Effect, Schedule } from "effect"
 * import { getBalance, withTimeout, withRetrySchedule } from "voltaire-effect"
 *
 * // Default timeout is 30s with exponential backoff retries
 * const balance = yield* getBalance(addr)
 *
 * // This call uses a 5s timeout and custom retry schedule
 * const fastBalance = yield* getBalance(addr).pipe(
 *   withTimeout("5 seconds"),
 *   withRetrySchedule(Schedule.recurs(1))
 * )
 * ```
 *
 * @example Custom override pattern
 * ```typescript
 * import * as FiberRef from "effect/FiberRef"
 * import * as Effect from "effect/Effect"
 *
 * const customRef = FiberRef.unsafeMake("default")
 * const withCustom = (value: string) => <A, E, R>(effect: Effect.Effect<A, E, R>) =>
 *   Effect.locally(effect, customRef, value)
 * ```
 */

import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as FiberRef from "effect/FiberRef";
import type * as Schedule from "effect/Schedule";
import type { TransportError } from "./TransportError.js";

/**
 * FiberRef for request timeout override (Duration).
 *
 * @since 0.0.1
 */
export const timeoutRef: FiberRef.FiberRef<Duration.Duration | undefined> =
	FiberRef.unsafeMake<Duration.Duration | undefined>(undefined);

/**
 * FiberRef for retry schedule override.
 * Uses Effect Schedule for full control over retry behavior.
 *
 * @since 0.0.1
 */
export const retryScheduleRef: FiberRef.FiberRef<
	Schedule.Schedule<unknown, TransportError> | undefined
> = FiberRef.unsafeMake<Schedule.Schedule<unknown, TransportError> | undefined>(
	undefined,
);

/**
 * FiberRef to enable/disable request deduplication cache.
 * Default: enabled.
 *
 * @since 0.0.1
 */
export const cacheEnabledRef: FiberRef.FiberRef<boolean> =
	FiberRef.unsafeMake<boolean>(true);

/**
 * FiberRef to enable/disable transport tracing.
 * Default: disabled.
 *
 * @since 0.0.1
 */
export const tracingRef: FiberRef.FiberRef<boolean> =
	FiberRef.unsafeMake<boolean>(false);

/**
 * Scoped timeout override helper.
 * Accepts Effect Duration input (e.g., "5 seconds", Duration.seconds(5), 5000).
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * getBalance(addr).pipe(withTimeout("5 seconds"))
 * getBalance(addr).pipe(withTimeout(Duration.seconds(5)))
 * ```
 */
export const withTimeout =
	(timeout: Duration.DurationInput) =>
	<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.locally(effect, timeoutRef, Duration.decode(timeout));

/**
 * Scoped retry schedule override helper.
 * Uses Effect Schedule for full control over retry behavior.
 *
 * @since 0.0.1
 *
 * @example Simple retry count
 * ```typescript
 * getBalance(addr).pipe(
 *   withRetrySchedule(Schedule.recurs(1))
 * )
 * ```
 *
 * @example Exponential backoff with jitter
 * ```typescript
 * getBalance(addr).pipe(
 *   withRetrySchedule(
 *     Schedule.exponential("500 millis").pipe(
 *       Schedule.jittered,
 *       Schedule.compose(Schedule.recurs(5))
 *     )
 *   )
 * )
 * ```
 */
export const withRetrySchedule =
	(schedule: Schedule.Schedule<unknown, TransportError>) =>
	<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.locally(effect, retryScheduleRef, schedule);

/**
 * Scoped helper that disables request caching/deduplication.
 *
 * @since 0.0.1
 */
export const withoutCache = <A, E, R>(
	effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> => Effect.locally(effect, cacheEnabledRef, false);

/**
 * Scoped helper that enables or disables transport tracing.
 *
 * @since 0.0.1
 */
export const withTracing =
	(enabled = true) =>
	<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.locally(effect, tracingRef, enabled);
