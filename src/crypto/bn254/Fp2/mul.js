import * as Fp from "../Fp/index.js";

/**
 * Multiply two Fp2 elements
 *
 * @param {import('../Fp2.js').Fp2} a - First element
 * @param {import('../Fp2.js').Fp2} b - Second element
 * @returns {import('../Fp2.js').Fp2} Product
 *
 * @example
 * ```typescript
 * const product = mul(a, b);
 * ```
 */
export function mul(a, b) {
	const aa = Fp.mul(a.c0, b.c0);
	const bb = Fp.mul(a.c1, b.c1);
	const o = Fp.mul(Fp.add(a.c0, a.c1), Fp.add(b.c0, b.c1));
	return { c0: Fp.sub(aa, bb), c1: Fp.sub(Fp.sub(o, aa), bb) };
}
