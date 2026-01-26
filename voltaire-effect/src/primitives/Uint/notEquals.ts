/**
 * @fileoverview Uint256 inequality check.
 * @module notEquals
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Checks if two Uint256 values are not equal.
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if a !== b
 *
 * @example
 * ```typescript
 * Uint.notEquals(a, b) // true or false
 * ```
 *
 * @since 0.0.1
 */
export const notEquals = (a: Uint256Type, b: Uint256Type): boolean =>
	Uint256.notEquals(a, b);
