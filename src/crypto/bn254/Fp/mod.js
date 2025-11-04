import { FP_MOD } from "../constants.js";

/**
 * Reduce element modulo field modulus Fp
 *
 * @param {bigint} a - Element to reduce
 * @returns {bigint} Result in range [0, FP_MOD)
 *
 * @example
 * ```typescript
 * const result = mod(123456789n);
 * ```
 */
export function mod(a) {
	const result = a % FP_MOD;
	return result < 0n ? result + FP_MOD : result;
}
