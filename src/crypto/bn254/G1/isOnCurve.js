import * as Fp from "../Fp/index.js";
import { B_G1 } from "../constants.js";
import { isZero } from "./isZero.js";

/**
 * Check if G1 point is on curve: y^2 = x^3 + 3
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG1Point.js').BrandedG1Point} point - Point to check
 * @returns {boolean} True if on curve
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const point = G1.generator();
 * if (G1.isOnCurve(point)) {
 *   console.log('Point is on curve');
 * }
 * ```
 */
export function isOnCurve(point) {
	if (isZero(point)) return true;

	const z2 = Fp.mul(point.z, point.z);
	const z4 = Fp.mul(z2, z2);
	const z6 = Fp.mul(z4, z2);

	const y2 = Fp.mul(point.y, point.y);
	const x3 = Fp.mul(Fp.mul(point.x, point.x), point.x);
	const b_z6 = Fp.mul(B_G1, z6);

	return y2 === Fp.add(x3, b_z6);
}
