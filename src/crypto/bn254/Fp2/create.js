import * as Fp from "../Fp/index.js";

/**
 * Create an Fp2 element
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} c0 - First component
 * @param {bigint} c1 - Second component
 * @returns {import('../Fp2.js').Fp2} Fp2 element
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const elem = Fp2.create(123n, 456n);
 * ```
 */
export function create(c0, c1) {
	return { c0: Fp.mod(c0), c1: Fp.mod(c1) };
}
