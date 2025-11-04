import * as Fp from "../Fp/index.js";

/**
 * Square an Fp2 element
 *
 * @param {import('../Fp2.js').Fp2} a - Element to square
 * @returns {import('../Fp2.js').Fp2} Square
 *
 * @example
 * ```typescript
 * const squared = square(a);
 * ```
 */
export function square(a) {
	const a0_2 = Fp.mul(a.c0, a.c0);
	const a1_2 = Fp.mul(a.c1, a.c1);
	return {
		c0: Fp.sub(a0_2, a1_2),
		c1: Fp.mul(Fp.mul(a.c0, a.c1), 2n),
	};
}
