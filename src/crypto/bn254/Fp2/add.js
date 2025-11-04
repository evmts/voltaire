import * as Fp from "../Fp/index.js";

/**
 * Add two Fp2 elements
 *
 * @param {import('../Fp2.js').Fp2} a - First element
 * @param {import('../Fp2.js').Fp2} b - Second element
 * @returns {import('../Fp2.js').Fp2} Sum
 *
 * @example
 * ```typescript
 * const sum = add(a, b);
 * ```
 */
export function add(a, b) {
	return { c0: Fp.add(a.c0, b.c0), c1: Fp.add(a.c1, b.c1) };
}
