/**
 * @fileoverview Uint256 validation check.
 * @module isValid
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Check if value is a valid Uint256.
 *
 * @param value - Value to check
 * @returns true if value is valid Uint256
 *
 * @example
 * ```typescript
 * Uint.isValid(100n) // true
 * Uint.isValid(-1n) // false
 * Uint.isValid("hello") // false
 * ```
 *
 * @since 0.0.1
 */
export const isValid = (value: unknown): value is Uint256Type =>
	Uint256.isValid(value);
