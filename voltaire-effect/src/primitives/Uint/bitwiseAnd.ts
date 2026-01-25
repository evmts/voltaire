/**
 * @fileoverview Effect-based Uint256 bitwise AND.
 * @module bitwiseAnd
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Bitwise AND of two Uint256 values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns Effect yielding a & b
 *
 * @example
 * ```typescript
 * const result = Effect.runSync(Uint.bitwiseAnd(a, b))
 * ```
 *
 * @since 0.0.1
 */
export const bitwiseAnd = (
	a: Uint256Type,
	b: Uint256Type,
): Effect.Effect<Uint256Type> => Effect.sync(() => Uint256.bitwiseAnd(a, b));
