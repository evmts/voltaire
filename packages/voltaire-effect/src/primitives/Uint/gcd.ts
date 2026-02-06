/**
 * @fileoverview Uint256 greatest common divisor.
 * @module gcd
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Computes greatest common divisor of two Uint256 values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns gcd(a, b)
 *
 * @example
 * ```typescript
 * const divisor = Uint.gcd(a, b)
 * ```
 *
 * @since 0.0.1
 */
export const gcd = (a: Uint256Type, b: Uint256Type): Uint256Type =>
	Uint256.gcd(a, b);
