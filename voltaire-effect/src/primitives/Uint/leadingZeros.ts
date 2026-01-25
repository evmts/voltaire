/**
 * @fileoverview Effect-based Uint256 leading zeros count.
 * @module leadingZeros
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Returns the number of leading zero bits in this Uint256.
 *
 * @param uint - Value to measure
 * @returns Effect yielding number of leading zeros
 *
 * @example
 * ```typescript
 * const zeros = Effect.runSync(Uint.leadingZeros(uint))
 * ```
 *
 * @since 0.0.1
 */
export const leadingZeros = (uint: Uint256Type): Effect.Effect<number> =>
	Effect.sync(() => Uint256.leadingZeros(uint));
