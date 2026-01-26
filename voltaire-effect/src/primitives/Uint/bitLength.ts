/**
 * @fileoverview Uint256 bit length.
 * @module bitLength
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Returns the number of bits required to represent this Uint256.
 *
 * @param uint - Value to measure
 * @returns Number of bits
 *
 * @example
 * ```typescript
 * const bits = Uint.bitLength(uint)
 * ```
 *
 * @since 0.0.1
 */
export const bitLength = (uint: Uint256Type): number => Uint256.bitLength(uint);
