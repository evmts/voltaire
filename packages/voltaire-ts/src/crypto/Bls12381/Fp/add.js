import { FP_MOD } from "../constants.js";

/**
 * Add two field elements
 *
 * @param {bigint} a - First operand
 * @param {bigint} b - Second operand
 * @returns {bigint} (a + b) mod p
 */
export function add(a, b) {
	const result = a + b;
	return result >= FP_MOD ? result - FP_MOD : result;
}
