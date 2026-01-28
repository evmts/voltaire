/**
 * @fileoverview Uint256 type guard.
 * @module isUint256
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from "@tevm/voltaire/Uint";

/**
 * Type guard for Uint256.
 *
 * @param value - Value to check
 * @returns true if value is valid Uint256
 *
 * @example
 * ```typescript
 * if (Uint.isUint256(value)) {
 *   const hex = Uint.toHex(value)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const isUint256 = (value: unknown): value is Uint256Type =>
	Uint256.isValid(value);
