import * as Fp from "../Fp/index.js";
import { isZero } from "./isZero.js";

/**
 * Check if two G1 points are equal
 * In projective coordinates: P1 = P2 iff X1*Z2 = X2*Z1 and Y1*Z2 = Y2*Z1
 *
 * @param {import('../G1PointType.js').G1PointType} p1 - First point
 * @param {import('../G1PointType.js').G1PointType} p2 - Second point
 * @returns {boolean}
 */
export function equal(p1, p2) {
	const p1Zero = isZero(p1);
	const p2Zero = isZero(p2);

	if (p1Zero && p2Zero) return true;
	if (p1Zero || p2Zero) return false;

	// X1*Z2 = X2*Z1
	const x1z2 = Fp.mul(p1.x, p2.z);
	const x2z1 = Fp.mul(p2.x, p1.z);
	if (x1z2 !== x2z1) return false;

	// Y1*Z2 = Y2*Z1
	const y1z2 = Fp.mul(p1.y, p2.z);
	const y2z1 = Fp.mul(p2.y, p1.z);
	return y1z2 === y2z1;
}
