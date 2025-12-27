import * as Fp from "../Fp/index.js";

/**
 * Invert an Fp2 element
 * 1/(a0 + a1*i) = (a0 - a1*i) / (a0^2 + a1^2)
 * The denominator is in Fp since (a0 + a1*i)(a0 - a1*i) = a0^2 + a1^2
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - Value to invert
 * @returns {import('../Fp2Type.js').Fp2Type}
 */
export function inv(a) {
	// norm = a0^2 + a1^2 (since i^2 = -1, norm of complex is sum of squares)
	const norm = Fp.add(Fp.mul(a.c0, a.c0), Fp.mul(a.c1, a.c1));
	const normInv = Fp.inv(norm);
	return {
		c0: Fp.mul(a.c0, normInv),
		c1: Fp.neg(Fp.mul(a.c1, normInv)),
	};
}
