import * as Fp from "../Fp/index.js";

/**
 * Compute conjugate of Fp2 element
 * conj(a0 + a1*i) = a0 - a1*i
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - Value to conjugate
 * @returns {import('../Fp2Type.js').Fp2Type}
 */
export function conjugate(a) {
	return {
		c0: a.c0,
		c1: Fp.neg(a.c1),
	};
}
