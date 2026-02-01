/**
 * @fileoverview Effect wrapper for Hex.toBigInt.
 * Converts Hex to bigint.
 * @module voltaire-effect/primitives/Hex/toBigInt
 * @since 0.1.0
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";

/**
 * Convert Hex to bigint.
 *
 * This is an infallible operation - hex always converts to bigint.
 *
 * @param hex - Hex string to convert
 * @returns bigint value
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * Hex.toBigInt('0xff' as HexType)  // 255n
 * ```
 *
 * @since 0.1.0
 */
export const toBigInt = (hex: HexType): bigint => VoltaireHex.toBigInt(hex);
