import { FR_MOD } from "../constants.js";

/**
 * Reduce element modulo scalar field modulus Fr
 *
 * @param {bigint} a - Element to reduce
 * @returns {bigint} Result in range [0, FR_MOD)
 *
 * @example
 * ```typescript
 * const result = mod(123456789n);
 * ```
 */
export function mod(a) {
	const result = a % FR_MOD;
	return result < 0n ? result + FR_MOD : result;
}
