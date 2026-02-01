import { FR_MOD } from "../constants.js";
/**
 * Reduce a bigint modulo the scalar field order r
 *
 * @param {bigint} a - Value to reduce
 * @returns {bigint} Value reduced to [0, r-1]
 */
export function mod(a) {
    const result = a % FR_MOD;
    return result >= 0n ? result : result + FR_MOD;
}
