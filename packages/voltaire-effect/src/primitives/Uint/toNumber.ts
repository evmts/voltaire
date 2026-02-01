/**
 * @fileoverview Effect-based Uint256 to number conversion.
 * @module toNumber
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Converts a Uint256 to number.
 *
 * @description
 * Note: This may lose precision for values > Number.MAX_SAFE_INTEGER.
 *
 * @param uint - The Uint256 to convert
 * @returns Effect yielding number value
 *
 * @example
 * ```typescript
 * const value = Effect.runSync(Uint.toNumber(uint))
 * // 255
 * ```
 *
 * @since 0.0.1
 */
export const toNumber = (uint: Uint256Type): Effect.Effect<number> =>
	Effect.sync(() => Uint256.toNumber(uint));
