import * as Fp2 from "../Fp2/index.js";
import { isZero } from "./isZero.js";

/**
 * Check if two G2 points are equal
 *
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - First point
 * @param {import('../BrandedG2Point.js').BrandedG2Point} other - Second point
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * if (equal(p1, p2)) { }
 * ```
 */
export function equal(point, other) {
	const thisInf = isZero(point);
	const otherInf = isZero(other);

	if (thisInf && otherInf) return true;
	if (thisInf !== otherInf) return false;

	const z1_2 = Fp2.square(point.z);
	const z2_2 = Fp2.square(other.z);

	const x1_z2_2 = Fp2.mul(point.x, z2_2);
	const x2_z1_2 = Fp2.mul(other.x, z1_2);

	const z1_3 = Fp2.mul(z1_2, point.z);
	const z2_3 = Fp2.mul(z2_2, other.z);

	const y1_z2_3 = Fp2.mul(point.y, z2_3);
	const y2_z1_3 = Fp2.mul(other.y, z1_3);

	return Fp2.equal(x1_z2_2, x2_z1_2) && Fp2.equal(y1_z2_3, y2_z1_3);
}
