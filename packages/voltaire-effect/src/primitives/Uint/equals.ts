/**
 * @fileoverview Uint256 equality check.
 * @module equals
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Checks if two Uint256 values are equal.
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if values are equal
 *
 * @example
 * ```typescript
 * Uint.equals(a, b) // true or false
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: Uint256Type, b: Uint256Type): boolean =>
	Uint256.equals(a, b);
