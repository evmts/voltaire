import * as Fp from "../Fp/index.js";
/**
 * Square an Fp2 element
 * (a0 + a1*i)^2 = (a0^2 - a1^2) + 2*a0*a1*i
 * Optimized: uses 2 muls instead of 3
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - Value to square
 * @returns {import('../Fp2Type.js').Fp2Type}
 */
export function square(a) {
    const t0 = Fp.add(a.c0, a.c1);
    const t1 = Fp.sub(a.c0, a.c1);
    const t2 = Fp.add(a.c0, a.c0);
    return {
        c0: Fp.mul(t0, t1), // (a0+a1)(a0-a1) = a0^2 - a1^2
        c1: Fp.mul(t2, a.c1), // 2*a0*a1
    };
}
