/**
 * @fileoverview Uint256 greater than comparison.
 * @module greaterThan
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Checks if first Uint256 is greater than second.
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if a > b
 *
 * @example
 * ```typescript
 * Uint.greaterThan(a, b) // true or false
 * ```
 *
 * @since 0.0.1
 */
export const greaterThan = (a: Uint256Type, b: Uint256Type): boolean =>
	Uint256.greaterThan(a, b);
