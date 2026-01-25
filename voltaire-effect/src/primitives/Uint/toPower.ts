/**
 * @fileoverview Effect-based Uint256 exponentiation with wrapping.
 * @module toPower
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Exponentiation of Uint256 values with wrapping.
 *
 * @description
 * Result is (base ^ exponent) mod 2^256. Does not throw on overflow.
 *
 * @param base - Base value
 * @param exponent - Exponent value
 * @returns Effect yielding result
 *
 * @example
 * ```typescript
 * const result = Effect.runSync(Uint.toPower(base, exp))
 * ```
 *
 * @since 0.0.1
 */
export const toPower = (
	base: Uint256Type,
	exponent: Uint256Type,
): Effect.Effect<Uint256Type> =>
	Effect.sync(() => Uint256.toPower(base, exponent));
