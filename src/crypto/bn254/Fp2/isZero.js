/**
 * Check if Fp2 element is zero
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - Element to check
 * @returns {boolean} True if zero
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 0n, c1: 0n };
 * if (Fp2.isZero(a)) {
 *   console.log('Element is zero');
 * }
 * ```
 */
export function isZero(a) {
	return a.c0 === 0n && a.c1 === 0n;
}
