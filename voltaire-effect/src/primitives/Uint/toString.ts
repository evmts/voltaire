/**
 * @fileoverview Effect-based Uint256 to string conversion.
 * @module toString
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Converts a Uint256 to string.
 *
 * @param uint - The Uint256 to convert
 * @param radix - Base to use for conversion (default 10)
 * @returns Effect yielding string representation
 *
 * @example
 * ```typescript
 * const decimal = Effect.runSync(Uint.toString(uint))
 * // "255"
 *
 * const hex = Effect.runSync(Uint.toString(uint, 16))
 * // "ff"
 * ```
 *
 * @since 0.0.1
 */
export const toString = (
	uint: Uint256Type,
	radix?: number,
): Effect.Effect<string> => Effect.sync(() => Uint256.toString(uint, radix));
