/**
 * @fileoverview Uint256 subtraction with wrapping.
 * @module minus
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Subtract two Uint256 values with wrapping.
 *
 * @description
 * Result is (a - b) mod 2^256. Does not throw on underflow.
 *
 * @param a - First operand
 * @param b - Second operand
 * @returns Difference
 *
 * @example
 * ```typescript
 * const diff = Uint.minus(a, b)
 * ```
 *
 * @since 0.0.1
 */
export const minus = (a: Uint256Type, b: Uint256Type): Uint256Type =>
	Uint256.minus(a, b);
