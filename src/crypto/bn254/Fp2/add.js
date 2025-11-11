import * as Fp from "../Fp/index.js";

/**
 * Add two Fp2 elements
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - First element
 * @param {import('../Fp2.js').Fp2} b - Second element
 * @returns {import('../Fp2.js').Fp2} Sum
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const b = { c0: 3n, c1: 4n };
 * const sum = Fp2.add(a, b);
 * ```
 */
export function add(a, b) {
	return { c0: Fp.add(a.c0, b.c0), c1: Fp.add(a.c1, b.c1) };
}
