/**
 * @fileoverview Uint256 bitwise AND.
 * @module bitwiseAnd
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Bitwise AND of two Uint256 values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns a & b
 *
 * @example
 * ```typescript
 * const result = Uint.bitwiseAnd(a, b)
 * ```
 *
 * @since 0.0.1
 */
export const bitwiseAnd = (a: Uint256Type, b: Uint256Type): Uint256Type =>
	Uint256.bitwiseAnd(a, b);
