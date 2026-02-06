import * as Fp2 from "../Fp2/index.js";
import { isZero } from "./isZero.js";

/**
 * Negate a G2 point (reflect over x-axis)
 *
 * @param {import('../G2PointType.js').G2PointType} point - Point to negate
 * @returns {import('../G2PointType.js').G2PointType}
 */
export function negate(point) {
	if (isZero(point)) return point;

	return /** @type {import('../G2PointType.js').G2PointType} */ ({
		x: point.x,
		y: Fp2.neg(point.y),
		z: point.z,
	});
}
