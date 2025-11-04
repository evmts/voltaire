import * as Fp from "../Fp/index.js";

/**
 * Negate Fp2 element
 *
 * @param {import('../Fp2.js').Fp2} a - Element to negate
 * @returns {import('../Fp2.js').Fp2} Negation
 *
 * @example
 * ```typescript
 * const negated = neg(a);
 * ```
 */
export function neg(a) {
	return { c0: Fp.neg(a.c0), c1: Fp.neg(a.c1) };
}
