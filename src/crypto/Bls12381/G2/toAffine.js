import * as Fp2 from "../Fp2/index.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Convert G2 point from projective to affine coordinates
 * Affine: (x/z^2, y/z^3, 1)
 *
 * @param {import('../G2PointType.js').G2PointType} point - Point to convert
 * @returns {import('../G2PointType.js').G2PointType}
 */
export function toAffine(point) {
	if (isZero(point)) return infinity();

	const { x, y, z } = point;

	// Check if z is already 1
	if (z.c0 === 1n && z.c1 === 0n) return point;

	const zInv = Fp2.inv(z);
	const zInv2 = Fp2.square(zInv);
	const zInv3 = Fp2.mul(zInv2, zInv);

	return /** @type {import('../G2PointType.js').G2PointType} */ ({
		x: Fp2.mul(x, zInv2),
		y: Fp2.mul(y, zInv3),
		z: { c0: 1n, c1: 0n },
	});
}
