/**
 * @fileoverview Effect-based Uint256 zero check.
 * @module isZero
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Checks if a Uint256 value is zero.
 *
 * @param uint - Value to check
 * @returns Effect yielding boolean
 *
 * @example
 * ```typescript
 * const isZero = Effect.runSync(Uint.isZero(uint))
 * ```
 *
 * @since 0.0.1
 */
export const isZero = (uint: Uint256Type): Effect.Effect<boolean> =>
	Effect.sync(() => Uint256.isZero(uint));
