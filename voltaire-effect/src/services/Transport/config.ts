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
 * @example
 * ```typescript
 * import { Effect } from "effect"
 * import { withTimeout, withRetries } from "voltaire-effect/services"
 *
 * // Default timeout is 30s
 * const balance = yield* provider.getBalance(addr)
 *
 * // This call uses a 5s timeout and 1 retry without affecting others
 * const fastBalance = yield* provider.getBalance(addr).pipe(
 *   withTimeout(5000),
 *   withRetries(1)
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

import * as Effect from "effect/Effect";
import * as FiberRef from "effect/FiberRef";

/**
 * FiberRef for request timeout override (milliseconds).
 *
 * @since 0.0.1
 */
export const timeoutRef: FiberRef.FiberRef<number | undefined> =
	FiberRef.unsafeMake<number | undefined>(undefined);

/**
 * FiberRef for retry count override.
 *
 * @since 0.0.1
 */
export const retryCountRef: FiberRef.FiberRef<number | undefined> =
	FiberRef.unsafeMake<number | undefined>(undefined);

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
 *
 * @since 0.0.1
 */
export const withTimeout =
	(milliseconds: number) =>
	<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.locally(effect, timeoutRef, milliseconds);

/**
 * Scoped retry count override helper.
 *
 * @since 0.0.1
 */
export const withRetries =
	(retryCount: number) =>
	<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
		Effect.locally(effect, retryCountRef, retryCount);

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

