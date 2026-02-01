import * as Fp from "../Fp/index.js";

/**
 * Multiply Fp2 element by Fp scalar
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - Fp2 element
 * @param {bigint} scalar - Fp scalar
 * @returns {import('../Fp2Type.js').Fp2Type}
 */
export function mulScalar(a, scalar) {
	return {
		c0: Fp.mul(a.c0, scalar),
		c1: Fp.mul(a.c1, scalar),
	};
}
