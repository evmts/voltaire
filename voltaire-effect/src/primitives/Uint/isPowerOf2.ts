/**
 * @fileoverview Uint256 power of 2 check.
 * @module isPowerOf2
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Checks if a Uint256 value is a power of 2.
 *
 * @param uint - Value to check
 * @returns true if value is a power of 2
 *
 * @example
 * ```typescript
 * Uint.isPowerOf2(uint) // true or false
 * ```
 *
 * @since 0.0.1
 */
export const isPowerOf2 = (uint: Uint256Type): boolean =>
	Uint256.isPowerOf2(uint);
