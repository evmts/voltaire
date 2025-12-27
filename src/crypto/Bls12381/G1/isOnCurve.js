import * as Fp from "../Fp/index.js";
import { B_G1 } from "../constants.js";
import { isZero } from "./isZero.js";

/**
 * Check if a G1 point is on the curve y^2 = x^3 + 4
 * In Jacobian projective coordinates where (X, Y, Z) represents (X/Z^2, Y/Z^3):
 * Y^2 = X^3 + b*Z^6
 *
 * @param {import('../G1PointType.js').G1PointType} point - Point to check
 * @returns {boolean}
 */
export function isOnCurve(point) {
	if (isZero(point)) return true;

	const { x, y, z } = point;

	// Y^2
	const lhs = Fp.mul(y, y);

	// X^3 + b * Z^6
	const x2 = Fp.mul(x, x);
	const x3 = Fp.mul(x2, x);
	const z2 = Fp.mul(z, z);
	const z4 = Fp.mul(z2, z2);
	const z6 = Fp.mul(z4, z2);
	const rhs = Fp.add(x3, Fp.mul(B_G1, z6));

	return lhs === rhs;
}
