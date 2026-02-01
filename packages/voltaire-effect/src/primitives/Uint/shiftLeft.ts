/**
 * @fileoverview Uint256 left shift.
 * @module shiftLeft
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Left shift a Uint256 value.
 *
 * @param uint - Value to shift
 * @param bits - Number of bits to shift
 * @returns uint << bits (within 256-bit range)
 *
 * @example
 * ```typescript
 * const result = Uint.shiftLeft(uint, bits)
 * ```
 *
 * @since 0.0.1
 */
export const shiftLeft = (uint: Uint256Type, bits: Uint256Type): Uint256Type =>
	Uint256.shiftLeft(uint, bits);
