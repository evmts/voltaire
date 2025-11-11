/**
 * Check if two Fp2 elements are equal
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - First element
 * @param {import('../Fp2.js').Fp2} b - Second element
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const b = { c0: 1n, c1: 2n };
 * if (Fp2.equal(a, b)) {
 *   console.log('Elements are equal');
 * }
 * ```
 */
export function equal(a, b) {
	return a.c0 === b.c0 && a.c1 === b.c1;
}
