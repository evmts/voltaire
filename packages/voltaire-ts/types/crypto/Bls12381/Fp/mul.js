import { FP_MOD } from "../constants.js";
/**
 * Multiply two field elements
 *
 * @param {bigint} a - First operand
 * @param {bigint} b - Second operand
 * @returns {bigint} (a * b) mod p
 */
export function mul(a, b) {
    return (a * b) % FP_MOD;
}
