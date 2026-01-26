/**
 * @fileoverview Uint256 clone.
 * @module clone
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Creates a copy of a Uint256.
 *
 * @param uint - Value to clone
 * @returns Cloned Uint256
 *
 * @example
 * ```typescript
 * const copy = Uint.clone(uint)
 * ```
 *
 * @since 0.0.1
 */
export const clone = (uint: Uint256Type): Uint256Type => Uint256.clone(uint);
