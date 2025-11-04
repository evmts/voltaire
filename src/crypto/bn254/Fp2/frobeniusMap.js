import { conjugate } from "./conjugate.js";

/**
 * Frobenius endomorphism for Fp2
 *
 * @param {import('../Fp2.js').Fp2} a - Element
 * @returns {import('../Fp2.js').Fp2} Frobenius map result
 *
 * @example
 * ```typescript
 * const frob = frobeniusMap(a);
 * ```
 */
export function frobeniusMap(a) {
	return conjugate(a);
}
