import * as Fp from "../Fp/index.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Convert G1 point to affine coordinates
 *
 * @param {import('../BrandedG1Point.js').BrandedG1Point} point - Point in projective coordinates
 * @returns {import('../BrandedG1Point.js').BrandedG1Point} Point in affine coordinates
 *
 * @example
 * ```typescript
 * const affine = toAffine(point);
 * ```
 */
export function toAffine(point) {
	if (isZero(point)) return infinity();

	const zInv = Fp.inv(point.z);
	const zInv2 = Fp.mul(zInv, zInv);
	const zInv3 = Fp.mul(zInv2, zInv);

	return /** @type {import('../BrandedG1Point.js').BrandedG1Point} */ ({
		x: Fp.mul(point.x, zInv2),
		y: Fp.mul(point.y, zInv3),
		z: 1n,
	});
}
