import * as Fp2 from "../Fp2/index.js";
import { B_G2_C0, B_G2_C1 } from "../constants.js";
import { isZero } from "./isZero.js";

/**
 * Check if G2 point is on curve: y^2 = x^3 + b where b = 3/(9+u)
 *
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point to check
 * @returns {boolean} True if on curve
 *
 * @example
 * ```typescript
 * if (isOnCurve(point)) { }
 * ```
 */
export function isOnCurve(point) {
	if (isZero(point)) return true;

	const z2 = Fp2.square(point.z);
	const z4 = Fp2.square(z2);
	const z6 = Fp2.mul(z4, z2);

	const y2 = Fp2.square(point.y);
	const x3 = Fp2.mul(Fp2.square(point.x), point.x);
	const b = Fp2.create(B_G2_C0, B_G2_C1);
	const b_z6 = Fp2.mul(b, z6);

	return Fp2.equal(y2, Fp2.add(x3, b_z6));
}
