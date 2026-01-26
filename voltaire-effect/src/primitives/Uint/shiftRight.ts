/**
 * @fileoverview Uint256 right shift.
 * @module shiftRight
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Right shift a Uint256 value.
 *
 * @param uint - Value to shift
 * @param bits - Number of bits to shift
 * @returns uint >> bits
 *
 * @example
 * ```typescript
 * const result = Uint.shiftRight(uint, bits)
 * ```
 *
 * @since 0.0.1
 */
export const shiftRight = (uint: Uint256Type, bits: Uint256Type): Uint256Type =>
	Uint256.shiftRight(uint, bits);
