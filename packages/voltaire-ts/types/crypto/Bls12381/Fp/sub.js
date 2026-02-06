import { FP_MOD } from "../constants.js";
/**
 * Subtract two field elements
 *
 * @param {bigint} a - First operand
 * @param {bigint} b - Second operand
 * @returns {bigint} (a - b) mod p
 */
export function sub(a, b) {
    const result = a - b;
    return result < 0n ? result + FP_MOD : result;
}
