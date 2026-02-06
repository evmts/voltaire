/**
 * @fileoverview Uint256 bitwise OR.
 * @module bitwiseOr
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Bitwise OR of two Uint256 values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns a | b
 *
 * @example
 * ```typescript
 * const result = Uint.bitwiseOr(a, b)
 * ```
 *
 * @since 0.0.1
 */
export const bitwiseOr = (a: Uint256Type, b: Uint256Type): Uint256Type =>
	Uint256.bitwiseOr(a, b);
