/**
 * @fileoverview Effect-based Uint256 greater than comparison.
 * @module greaterThan
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Checks if first Uint256 is greater than second.
 *
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding boolean (a > b)
 *
 * @example
 * ```typescript
 * const isGreater = Effect.runSync(Uint.greaterThan(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const greaterThan = (
	a: Uint256Type,
	b: Uint256Type,
): Effect.Effect<boolean> => Effect.sync(() => Uint256.greaterThan(a, b));
