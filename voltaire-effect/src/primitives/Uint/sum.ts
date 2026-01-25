/**
 * @fileoverview Effect-based Uint256 sum.
 * @module sum
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Sum of multiple Uint256 values with wrapping.
 *
 * @param values - Values to sum
 * @returns Effect yielding sum mod 2^256
 *
 * @example
 * ```typescript
 * const total = Effect.runSync(Uint.sum(a, b, c))
 * ```
 *
 * @since 0.0.1
 */
export const sum = (...values: Uint256Type[]): Effect.Effect<Uint256Type> =>
	Effect.sync(() => Uint256.sum(...values));
