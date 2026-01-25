/**
 * @fileoverview Effect-based Uint256 greater than or equal comparison.
 * @module greaterThanOrEqual
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Checks if first Uint256 is greater than or equal to second.
 *
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding boolean (a >= b)
 *
 * @example
 * ```typescript
 * const isGreaterOrEqual = Effect.runSync(Uint.greaterThanOrEqual(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const greaterThanOrEqual = (
	a: Uint256Type,
	b: Uint256Type,
): Effect.Effect<boolean> =>
	Effect.sync(() => Uint256.greaterThanOrEqual(a, b));
