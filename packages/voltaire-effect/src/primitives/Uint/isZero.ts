/**
 * @fileoverview Uint256 zero check.
 * @module isZero
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Checks if a Uint256 value is zero.
 *
 * @param uint - Value to check
 * @returns true if value is zero
 *
 * @example
 * ```typescript
 * Uint.isZero(uint) // true or false
 * ```
 *
 * @since 0.0.1
 */
export const isZero = (uint: Uint256Type): boolean => Uint256.isZero(uint);
