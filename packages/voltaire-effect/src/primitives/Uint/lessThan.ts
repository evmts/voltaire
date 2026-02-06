/**
 * @fileoverview Uint256 less than comparison.
 * @module lessThan
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Checks if first Uint256 is less than second.
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if a < b
 *
 * @example
 * ```typescript
 * Uint.lessThan(a, b) // true or false
 * ```
 *
 * @since 0.0.1
 */
export const lessThan = (a: Uint256Type, b: Uint256Type): boolean =>
	Uint256.lessThan(a, b);
