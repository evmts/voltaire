import { FP_MOD } from "../constants.js";

/**
 * Reduce a bigint modulo the field prime p
 *
 * @param {bigint} a - Value to reduce
 * @returns {bigint} Value reduced to [0, p-1]
 */
export function mod(a) {
	const result = a % FP_MOD;
	return result >= 0n ? result : result + FP_MOD;
}
