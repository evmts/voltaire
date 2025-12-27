import * as Fp2 from "../Fp2/index.js";
import { B_G2 } from "../constants.js";
import { isZero } from "./isZero.js";

/**
 * Check if a G2 point is on the curve y^2 = x^3 + 4(1+i)
 * In Jacobian projective coordinates where (X, Y, Z) represents (X/Z^2, Y/Z^3):
 * Y^2 = X^3 + b*Z^6
 *
 * @param {import('../G2PointType.js').G2PointType} point - Point to check
 * @returns {boolean}
 */
export function isOnCurve(point) {
	if (isZero(point)) return true;

	const { x, y, z } = point;

	// Y^2
	const lhs = Fp2.square(y);

	// X^3 + b * Z^6
	const x2 = Fp2.square(x);
	const x3 = Fp2.mul(x2, x);
	const z2 = Fp2.square(z);
	const z4 = Fp2.square(z2);
	const z6 = Fp2.mul(z4, z2);
	const rhs = Fp2.add(x3, Fp2.mul(B_G2, z6));

	return Fp2.equal(lhs, rhs);
}
