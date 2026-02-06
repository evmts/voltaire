import * as Fp from "../Fp/index.js";

/**
 * Negate Fp2 element
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - Element to negate
 * @returns {import('../Fp2.js').Fp2} Negation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const negated = Fp2.neg(a);
 * ```
 */
export function neg(a) {
	return { c0: Fp.neg(a.c0), c1: Fp.neg(a.c1) };
}
