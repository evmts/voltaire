/**
 * @fileoverview Hex zero creation function.
 * Creates a zero-filled hex string of specified size.
 * @module voltaire-effect/primitives/Hex/zero
 * @since 0.0.1
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

/**
 * Create a zero-filled hex string of specified byte size.
 *
 * @description
 * Creates a hex string filled with zeros of the specified size in bytes.
 * For example, size 4 produces '0x00000000'. This operation is infallible.
 *
 * @param {number} size - Size in bytes
 * @returns {Effect.Effect<HexType, never>} Effect that always succeeds with zero-filled hex
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * const zeros = await Effect.runPromise(Hex.zero(4)) // '0x00000000'
 * const empty = await Effect.runPromise(Hex.zero(0)) // '0x'
 * ```
 *
 * @since 0.0.1
 */
export const zero = (size: number): Effect.Effect<HexType, never> =>
	Effect.succeed(VoltaireHex.zero(size));
