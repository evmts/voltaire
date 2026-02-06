import { FP_MOD } from "../constants.js";
/**
 * Negate a field element
 *
 * @param {bigint} a - Value to negate
 * @returns {bigint} -a mod p
 */
export function neg(a) {
    return a === 0n ? 0n : FP_MOD - a;
}
