/**
 * @fileoverview Effect wrapper for Hex.trim.
 * Trims leading zeros from Hex.
 * @module voltaire-effect/primitives/Hex/trim
 * @since 0.1.0
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";

/**
 * Trim leading zeros from Hex.
 *
 * This is an infallible operation.
 *
 * @param hex - Hex string to trim
 * @returns Trimmed HexType
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * Hex.trim('0x00001234')  // '0x1234'
 * ```
 *
 * @since 0.1.0
 */
export const trim = (hex: HexType): HexType => VoltaireHex.trim(hex);
