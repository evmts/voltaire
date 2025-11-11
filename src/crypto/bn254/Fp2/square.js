import * as Fp from "../Fp/index.js";

/**
 * Square an Fp2 element
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - Element to square
 * @returns {import('../Fp2.js').Fp2} Square
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const squared = Fp2.square(a);
 * ```
 */
export function square(a) {
	const a0_2 = Fp.mul(a.c0, a.c0);
	const a1_2 = Fp.mul(a.c1, a.c1);
	return {
		c0: Fp.sub(a0_2, a1_2),
		c1: Fp.mul(Fp.mul(a.c0, a.c1), 2n),
	};
}
