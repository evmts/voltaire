/**
 * @fileoverview Hex equality check function.
 * Compares two hex strings for equality (case-insensitive).
 * @module voltaire-effect/primitives/Hex/equals
 * @since 0.0.1
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";

/**
 * Check if two hex strings are equal (case-insensitive).
 *
 * @description
 * Compares two hex strings for equality. The comparison is case-insensitive,
 * so '0xABCD' equals '0xabcd'. This operation is infallible.
 *
 * @param {HexType} hex - First hex string
 * @param {HexType} other - Second hex string to compare
 * @returns {boolean} true if the hex strings are equal
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 *
 * Hex.equals('0xABCD', '0xabcd') // true
 * Hex.equals('0x1234', '0x5678') // false
 * ```
 *
 * @since 0.0.1
 */
export const equals = (hex: HexType, other: HexType): boolean =>
	VoltaireHex.equals(hex, other);
