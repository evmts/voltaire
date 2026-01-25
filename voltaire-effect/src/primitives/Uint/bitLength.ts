/**
 * @fileoverview Effect-based Uint256 bit length.
 * @module bitLength
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Returns the number of bits required to represent this Uint256.
 *
 * @param uint - Value to measure
 * @returns Effect yielding number of bits
 *
 * @example
 * ```typescript
 * const bits = Effect.runSync(Uint.bitLength(uint))
 * ```
 *
 * @since 0.0.1
 */
export const bitLength = (uint: Uint256Type): Effect.Effect<number> =>
	Effect.sync(() => Uint256.bitLength(uint));
