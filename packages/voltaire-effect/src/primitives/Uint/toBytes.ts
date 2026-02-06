/**
 * @fileoverview Effect-based Uint256 to bytes conversion.
 * @module toBytes
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";
import * as Effect from "effect/Effect";

/**
 * Converts a Uint256 to bytes (big-endian, 32 bytes).
 *
 * @param uint - The Uint256 to convert
 * @returns Effect yielding 32-byte Uint8Array
 *
 * @example
 * ```typescript
 * const bytes = Effect.runSync(Uint.toBytes(uint))
 * // Uint8Array(32) [0, 0, ..., 255]
 * ```
 *
 * @since 0.0.1
 */
export const toBytes = (uint: Uint256Type): Effect.Effect<Uint8Array> =>
	Effect.sync(() => Uint256.toBytes(uint));
