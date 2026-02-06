import * as Fp from "../Fp/index.js";

/**
 * Conjugate of Fp2 element
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - Element
 * @returns {import('../Fp2.js').Fp2} Conjugate
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const conj = Fp2.conjugate(a);
 * ```
 */
export function conjugate(a) {
	return { c0: a.c0, c1: Fp.neg(a.c1) };
}
