/**
 * Check if an Fp2 element is zero
 *
 * @param {import('../Fp2Type.js').Fp2Type} a - Value to check
 * @returns {boolean}
 */
export function isZero(a) {
	return a.c0 === 0n && a.c1 === 0n;
}
