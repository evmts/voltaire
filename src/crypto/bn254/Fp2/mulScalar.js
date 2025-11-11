import * as Fp from "../Fp/index.js";

/**
 * Multiply Fp2 element by scalar
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} a - Fp2 element
 * @param {bigint} scalar - Scalar value
 * @returns {import('../Fp2.js').Fp2} Product
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const a = { c0: 1n, c1: 2n };
 * const result = Fp2.mulScalar(a, 2n);
 * ```
 */
export function mulScalar(a, scalar) {
	return { c0: Fp.mul(a.c0, scalar), c1: Fp.mul(a.c1, scalar) };
}
