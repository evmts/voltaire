import * as Fp2 from "../Fp2/index.js";

/**
 * Negate G2 point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point to negate
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Negated point
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * const neg = G2.negate(point);
 * ```
 */
export function negate(point) {
	return /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
		x: point.x,
		y: Fp2.neg(point.y),
		z: point.z,
	});
}
