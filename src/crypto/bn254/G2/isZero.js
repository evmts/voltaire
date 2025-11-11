import * as Fp2 from "../Fp2/index.js";

/**
 * Check if G2 point is at infinity
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point to check
 * @returns {boolean} True if at infinity
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const inf = G2.infinity();
 * if (G2.isZero(inf)) {
 *   console.log('Point is at infinity');
 * }
 * ```
 */
export function isZero(point) {
	return Fp2.isZero(point.z);
}
