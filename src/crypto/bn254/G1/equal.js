import * as Fp from "../Fp/index.js";
import { isZero } from "./isZero.js";

/**
 * Check if two G1 points are equal
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG1Point.js').BrandedG1Point} point - First point
 * @param {import('../BrandedG1Point.js').BrandedG1Point} other - Second point
 * @returns {boolean} True if equal
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const p1 = G1.generator();
 * const p2 = G1.generator();
 * if (G1.equal(p1, p2)) {
 *   console.log('Points are equal');
 * }
 * ```
 */
export function equal(point, other) {
	const thisInf = isZero(point);
	const otherInf = isZero(other);

	if (thisInf && otherInf) return true;
	if (thisInf !== otherInf) return false;

	const z1_2 = Fp.mul(point.z, point.z);
	const z2_2 = Fp.mul(other.z, other.z);

	const x1_z2_2 = Fp.mul(point.x, z2_2);
	const x2_z1_2 = Fp.mul(other.x, z1_2);

	const z1_3 = Fp.mul(z1_2, point.z);
	const z2_3 = Fp.mul(z2_2, other.z);

	const y1_z2_3 = Fp.mul(point.y, z2_3);
	const y2_z1_3 = Fp.mul(other.y, z1_3);

	return x1_z2_2 === x2_z1_2 && y1_z2_3 === y2_z1_3;
}
