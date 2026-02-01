import * as Fp from "../Fp/index.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Convert G1 point from projective to affine coordinates
 * Affine: (x/z^2, y/z^3, 1)
 *
 * @param {import('../G1PointType.js').G1PointType} point - Point to convert
 * @returns {import('../G1PointType.js').G1PointType}
 */
export function toAffine(point) {
	if (isZero(point)) return infinity();

	const { x, y, z } = point;

	if (z === 1n) return point;

	const zInv = Fp.inv(z);
	const zInv2 = Fp.mul(zInv, zInv);
	const zInv3 = Fp.mul(zInv2, zInv);

	return /** @type {import('../G1PointType.js').G1PointType} */ ({
		x: Fp.mul(x, zInv2),
		y: Fp.mul(y, zInv3),
		z: 1n,
	});
}
