import * as Fp2 from "../Fp2/index.js";

/**
 * Check if a G2 point is the point at infinity
 *
 * @param {import('../G2PointType.js').G2PointType} point - Point to check
 * @returns {boolean}
 */
export function isZero(point) {
	return Fp2.isZero(point.z);
}
