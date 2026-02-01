import * as Fp from "../Fp/index.js";
/**
 * Create an Fp2 element from two Fp elements
 *
 * @param {bigint} c0 - Real component
 * @param {bigint} c1 - Imaginary component
 * @returns {import('../Fp2Type.js').Fp2Type}
 */
export function create(c0, c1) {
    return {
        c0: Fp.mod(c0),
        c1: Fp.mod(c1),
    };
}
