/**
 * @fileoverview Uint256 greater than or equal comparison.
 * @module greaterThanOrEqual
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Checks if first Uint256 is greater than or equal to second.
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if a >= b
 *
 * @example
 * ```typescript
 * Uint.greaterThanOrEqual(a, b) // true or false
 * ```
 *
 * @since 0.0.1
 */
export const greaterThanOrEqual = (a: Uint256Type, b: Uint256Type): boolean =>
	Uint256.greaterThanOrEqual(a, b);
