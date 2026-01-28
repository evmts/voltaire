/**
 * @fileoverview Hex size function.
 * Returns the byte size of a Hex string.
 * @module voltaire-effect/primitives/Hex/size
 * @since 0.1.0
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";

/**
 * Get the byte size of a Hex string.
 *
 * This is an infallible operation.
 *
 * @param hex - Hex string
 * @returns Size in bytes
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * Hex.size('0x1234')      // 2
 * Hex.size('0xdeadbeef')  // 4
 * Hex.size('0x')          // 0
 * ```
 *
 * @since 0.1.0
 */
export const size = (hex: HexType): number => VoltaireHex.size(hex);
