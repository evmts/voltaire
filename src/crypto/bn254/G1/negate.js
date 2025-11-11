import * as Fp from "../Fp/index.js";

/**
 * Negate G1 point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG1Point.js').BrandedG1Point} point - Point to negate
 * @returns {import('../BrandedG1Point.js').BrandedG1Point} Negated point
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const point = G1.generator();
 * const neg = G1.negate(point);
 * ```
 */
export function negate(point) {
	return /** @type {import('../BrandedG1Point.js').BrandedG1Point} */ ({
		x: point.x,
		y: Fp.neg(point.y),
		z: point.z,
	});
}
