/**
 * @fileoverview Uint256 bitwise NOT.
 * @module bitwiseNot
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Bitwise NOT of a Uint256 value.
 *
 * @param uint - Value to negate
 * @returns ~uint (within 256-bit range)
 *
 * @example
 * ```typescript
 * const result = Uint.bitwiseNot(uint)
 * ```
 *
 * @since 0.0.1
 */
export const bitwiseNot = (uint: Uint256Type): Uint256Type =>
	Uint256.bitwiseNot(uint);
