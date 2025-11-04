/**
 * Check if Fp2 element is zero
 *
 * @param {import('../Fp2.js').Fp2} a - Element to check
 * @returns {boolean} True if zero
 *
 * @example
 * ```typescript
 * if (isZero(a)) { }
 * ```
 */
export function isZero(a) {
	return a.c0 === 0n && a.c1 === 0n;
}
