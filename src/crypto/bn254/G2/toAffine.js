import * as Fp2 from "../Fp2/index.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Convert G2 point to affine coordinates
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point in projective coordinates
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Point in affine coordinates
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * const affine = G2.toAffine(point);
 * ```
 */
export function toAffine(point) {
	if (isZero(point)) return infinity();

	const zInv = Fp2.inv(point.z);
	const zInv2 = Fp2.square(zInv);
	const zInv3 = Fp2.mul(zInv2, zInv);

	return /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
		x: Fp2.mul(point.x, zInv2),
		y: Fp2.mul(point.y, zInv3),
		z: Fp2.ONE,
	});
}
