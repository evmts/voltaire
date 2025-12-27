import * as Fp from "../Fp/index.js";
import { B_G1 } from "../constants.js";
import { isZero } from "./isZero.js";

/**
 * Check if a G1 point is on the curve y^2 = x^3 + 4
 * In projective coordinates: Y^2*Z = X^3 + 4*Z^3
 *
 * @param {import('../G1PointType.js').G1PointType} point - Point to check
 * @returns {boolean}
 */
export function isOnCurve(point) {
	if (isZero(point)) return true;

	const { x, y, z } = point;

	// y^2 * z
	const lhs = Fp.mul(Fp.mul(y, y), z);

	// x^3 + b * z^3
	const x2 = Fp.mul(x, x);
	const x3 = Fp.mul(x2, x);
	const z2 = Fp.mul(z, z);
	const z3 = Fp.mul(z2, z);
	const rhs = Fp.add(x3, Fp.mul(B_G1, z3));

	return lhs === rhs;
}
