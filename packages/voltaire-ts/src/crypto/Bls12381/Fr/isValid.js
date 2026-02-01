import { FR_MOD } from "../constants.js";

/**
 * Check if a scalar is valid (in the range [0, r-1])
 *
 * @param {bigint} scalar - Scalar to check
 * @returns {boolean} True if valid
 */
export function isValid(scalar) {
	return scalar >= 0n && scalar < FR_MOD;
}
