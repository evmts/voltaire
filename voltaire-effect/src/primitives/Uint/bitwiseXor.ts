/**
 * @fileoverview Uint256 bitwise XOR.
 * @module bitwiseXor
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Bitwise XOR of two Uint256 values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns a ^ b
 *
 * @example
 * ```typescript
 * const result = Uint.bitwiseXor(a, b)
 * ```
 *
 * @since 0.0.1
 */
export const bitwiseXor = (a: Uint256Type, b: Uint256Type): Uint256Type =>
	Uint256.bitwiseXor(a, b);
