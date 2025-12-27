import * as Fp from "../Fp/index.js";

/**
 * Add two Fp2 elements
 * (a0 + a1*i) + (b0 + b1*i) = (a0+b0) + (a1+b1)*i
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - First operand
 * @param {import('../Fp2Type.js').Fp2Type} b - Second operand
 * @returns {import('../Fp2Type.js').Fp2Type}
 */
export function add(a, b) {
	return {
		c0: Fp.add(a.c0, b.c0),
		c1: Fp.add(a.c1, b.c1),
	};
}
