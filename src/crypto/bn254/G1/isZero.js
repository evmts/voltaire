/**
 * Check if G1 point is at infinity
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG1Point.js').BrandedG1Point} point - Point to check
 * @returns {boolean} True if at infinity
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const inf = G1.infinity();
 * if (G1.isZero(inf)) {
 *   console.log('Point is at infinity');
 * }
 * ```
 */
export function isZero(point) {
	return point.z === 0n;
}
