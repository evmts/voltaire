import { FP_MOD } from "../constants.js";
/**
 * Modular exponentiation using square-and-multiply
 *
 * @param {bigint} base - Base value
 * @param {bigint} exp - Exponent
 * @returns {bigint} base^exp mod p
 */
export function pow(base, exp) {
    if (exp === 0n)
        return 1n;
    if (exp === 1n)
        return base % FP_MOD;
    let result = 1n;
    let b = base % FP_MOD;
    let e = exp;
    while (e > 0n) {
        if (e & 1n) {
            result = (result * b) % FP_MOD;
        }
        b = (b * b) % FP_MOD;
        e >>= 1n;
    }
    return result;
}
