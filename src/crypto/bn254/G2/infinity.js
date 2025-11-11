import * as Fp2 from "../Fp2/index.js";

/**
 * Point at infinity for G2
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Point at infinity
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const inf = G2.infinity();
 * ```
 */
export function infinity() {
	return /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
		x: Fp2.ZERO,
		y: Fp2.ZERO,
		z: Fp2.ZERO,
	});
}
