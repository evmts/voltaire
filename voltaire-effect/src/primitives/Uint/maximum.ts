/**
 * @fileoverview Effect-based Uint256 maximum.
 * @module maximum
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Returns the maximum of two Uint256 values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding max(a, b)
 *
 * @example
 * ```typescript
 * const max = Effect.runSync(Uint.maximum(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const maximum = (
	a: Uint256Type,
	b: Uint256Type,
): Effect.Effect<Uint256Type> => Effect.sync(() => Uint256.maximum(a, b));
