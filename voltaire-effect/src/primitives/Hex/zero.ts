/**
 * @fileoverview Hex zero creation function.
 * Creates a zero-filled hex string of specified size.
 * @module voltaire-effect/primitives/Hex/zero
 * @since 0.0.1
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";

/**
 * Create a zero-filled hex string of specified byte size.
 *
 * @description
 * Creates a hex string filled with zeros of the specified size in bytes.
 * For example, size 4 produces '0x00000000'. This operation is infallible.
 *
 * @param {number} size - Size in bytes
 * @returns {HexType} Zero-filled hex string
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * const zeros = Hex.zero(4) // '0x00000000'
 * const empty = Hex.zero(0) // '0x'
 * ```
 *
 * @since 0.0.1
 */
export const zero = (size: number): HexType => VoltaireHex.zero(size);
