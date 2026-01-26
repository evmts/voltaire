/**
 * @fileoverview Uint256 addition with wrapping.
 * @module plus
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Add two Uint256 values with wrapping.
 *
 * @description
 * Result is (a + b) mod 2^256. Does not throw on overflow.
 *
 * @param a - First operand
 * @param b - Second operand
 * @returns Sum
 *
 * @example
 * ```typescript
 * const sum = Uint.plus(a, b)
 * ```
 *
 * @since 0.0.1
 */
export const plus = (a: Uint256Type, b: Uint256Type): Uint256Type =>
	Uint256.plus(a, b);
