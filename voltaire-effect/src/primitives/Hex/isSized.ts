/**
 * @fileoverview Hex size check function.
 * Checks if a hex string has a specific byte size.
 * @module voltaire-effect/primitives/Hex/isSized
 * @since 0.0.1
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";

/**
 * Check if a hex string has a specific byte size.
 *
 * @description
 * Returns true if the hex string is exactly the specified size in bytes.
 * Does not throw - returns a boolean. This operation is infallible.
 *
 * @param {HexType} hex - Hex string to check
 * @param {number} targetSize - Expected size in bytes
 * @returns {boolean} true if the hex string has the specified size
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * Hex.isSized('0x1234', 2)    // true
 * Hex.isSized('0x1234', 4)    // false
 * ```
 *
 * @since 0.0.1
 */
export const isSized = <TSize extends number>(
	hex: HexType,
	targetSize: TSize,
): boolean => VoltaireHex.isSized(hex, targetSize);
