/**
 * @fileoverview Hex clone function.
 * Creates a copy of a hex string.
 * @module voltaire-effect/primitives/Hex/clone
 * @since 0.0.1
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";

/**
 * Create a copy of a hex string.
 *
 * @description
 * Creates a new hex string that is a copy of the input. Since JavaScript
 * strings are immutable, this is primarily useful for type consistency
 * and ensuring a new string reference. This operation is infallible.
 *
 * @param {HexType} hex - Hex string to clone
 * @returns {Effect.Effect<HexType, never>} Effect that always succeeds with the cloned hex
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * const original = '0x1234' as HexType
 * const copy = await Effect.runPromise(Hex.clone(original)) // '0x1234'
 * ```
 *
 * @since 0.0.1
 */
export const clone = (hex: HexType): Effect.Effect<HexType, never> =>
	Effect.succeed(VoltaireHex.clone(hex));
