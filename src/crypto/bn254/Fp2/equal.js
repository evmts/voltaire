/**
 * Check if two Fp2 elements are equal
 *
 * @param {import('../Fp2.js').Fp2} a - First element
 * @param {import('../Fp2.js').Fp2} b - Second element
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * if (equal(a, b)) { }
 * ```
 */
export function equal(a, b) {
	return a.c0 === b.c0 && a.c1 === b.c1;
}
