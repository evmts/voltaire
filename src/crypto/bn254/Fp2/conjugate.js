import * as Fp from "../Fp/index.js";

/**
 * Conjugate of Fp2 element
 *
 * @param {import('../Fp2.js').Fp2} a - Element
 * @returns {import('../Fp2.js').Fp2} Conjugate
 *
 * @example
 * ```typescript
 * const conj = conjugate(a);
 * ```
 */
export function conjugate(a) {
	return { c0: a.c0, c1: Fp.neg(a.c1) };
}
