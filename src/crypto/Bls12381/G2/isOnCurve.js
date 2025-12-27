import * as Fp2 from "../Fp2/index.js";
import { B_G2 } from "../constants.js";
import { isZero } from "./isZero.js";

/**
 * Check if a G2 point is on the curve y^2 = x^3 + 4(1+i)
 * In projective coordinates: Y^2*Z = X^3 + B*Z^3
 *
 * @param {import('../G2PointType.js').G2PointType} point - Point to check
 * @returns {boolean}
 */
export function isOnCurve(point) {
	if (isZero(point)) return true;

	const { x, y, z } = point;

	// y^2 * z
	const lhs = Fp2.mul(Fp2.square(y), z);

	// x^3 + b * z^3
	const x2 = Fp2.square(x);
	const x3 = Fp2.mul(x2, x);
	const z2 = Fp2.square(z);
	const z3 = Fp2.mul(z2, z);
	const rhs = Fp2.add(x3, Fp2.mul(B_G2, z3));

	return Fp2.equal(lhs, rhs);
}
