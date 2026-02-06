/**
 * @fileoverview Effect-based Uint256 to bigint conversion.
 * @module toBigInt
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Converts a Uint256 to bigint.
 *
 * @param uint - The Uint256 to convert
 * @returns Effect yielding bigint value
 *
 * @example
 * ```typescript
 * const value = Effect.runSync(Uint.toBigInt(uint))
 * // 255n
 * ```
 *
 * @since 0.0.1
 */
export const toBigInt = (uint: Uint256Type): Effect.Effect<bigint> =>
	Effect.sync(() => Uint256.toBigInt(uint));
