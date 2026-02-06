import * as Fp from "../Fp/index.js";

/**
 * Negate an Fp2 element
 * -(a0 + a1*i) = -a0 + (-a1)*i
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - Value to negate
 * @returns {import('../Fp2Type.js').Fp2Type}
 */
export function neg(a) {
	return {
		c0: Fp.neg(a.c0),
		c1: Fp.neg(a.c1),
	};
}
