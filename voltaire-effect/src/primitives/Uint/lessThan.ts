/**
 * @fileoverview Effect-based Uint256 less than comparison.
 * @module lessThan
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Checks if first Uint256 is less than second.
 *
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding boolean (a < b)
 *
 * @example
 * ```typescript
 * const isLess = Effect.runSync(Uint.lessThan(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const lessThan = (
	a: Uint256Type,
	b: Uint256Type,
): Effect.Effect<boolean> => Effect.sync(() => Uint256.lessThan(a, b));
