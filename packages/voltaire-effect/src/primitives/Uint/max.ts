/**
 * @fileoverview Effect-based Uint256 max of variadic args.
 * @module max
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Returns the maximum of multiple Uint256 values.
 *
 * @param values - Values to compare
 * @returns Effect yielding maximum value
 *
 * @example
 * ```typescript
 * const max = Effect.runSync(Uint.max(a, b, c))
 * ```
 *
 * @since 0.0.1
 */
export const max = (...values: Uint256Type[]): Effect.Effect<Uint256Type> =>
	Effect.sync(() => Uint256.max(...values));
