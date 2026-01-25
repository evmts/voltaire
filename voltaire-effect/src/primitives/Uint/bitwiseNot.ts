/**
 * @fileoverview Effect-based Uint256 bitwise NOT.
 * @module bitwiseNot
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Bitwise NOT of a Uint256 value.
 *
 * @param uint - Value to negate
 * @returns Effect yielding ~uint (within 256-bit range)
 *
 * @example
 * ```typescript
 * const result = Effect.runSync(Uint.bitwiseNot(uint))
 * ```
 *
 * @since 0.0.1
 */
export const bitwiseNot = (uint: Uint256Type): Effect.Effect<Uint256Type> =>
	Effect.sync(() => Uint256.bitwiseNot(uint));
