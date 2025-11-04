import { FR_MOD } from "../constants.js";

/**
 * Check if scalar is valid (in range [0, FR_MOD))
 *
 * @param {bigint} scalar - Scalar to check
 * @returns {boolean} True if valid
 *
 * @example
 * ```typescript
 * if (isValid(scalar)) { }
 * ```
 */
export function isValid(scalar) {
	return scalar >= 0n && scalar < FR_MOD;
}
