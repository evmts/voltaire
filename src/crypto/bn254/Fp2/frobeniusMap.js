import { conjugate } from "./conjugate.js";

/**
 * Frobenius endomorphism for Fp2
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - Element
 * @returns {import('../Fp2.js').Fp2} Frobenius map result
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const frob = Fp2.frobeniusMap(a);
 * ```
 */
export function frobeniusMap(a) {
	return conjugate(a);
}
