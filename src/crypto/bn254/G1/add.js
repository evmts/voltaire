import * as Fp from "../Fp/index.js";
import { double } from "./double.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Add two G1 points
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG1Point.js').BrandedG1Point} point - First point
 * @param {import('../BrandedG1Point.js').BrandedG1Point} other - Second point
 * @returns {import('../BrandedG1Point.js').BrandedG1Point} Sum
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const p1 = G1.generator();
 * const p2 = G1.double(p1);
 * const sum = G1.add(p1, p2);
 * ```
 */
export function add(point, other) {
	if (isZero(point)) return other;
	if (isZero(other)) return point;

	const z1_2 = Fp.mul(point.z, point.z);
	const z2_2 = Fp.mul(other.z, other.z);
	const u1 = Fp.mul(point.x, z2_2);
	const u2 = Fp.mul(other.x, z1_2);

	const z1_3 = Fp.mul(z1_2, point.z);
	const z2_3 = Fp.mul(z2_2, other.z);
	const s1 = Fp.mul(point.y, z2_3);
	const s2 = Fp.mul(other.y, z1_3);

	if (u1 === u2) {
		if (s1 === s2) {
			return double(point);
		}
		return infinity();
	}

	const h = Fp.sub(u2, u1);
	const r = Fp.sub(s2, s1);

	const h2 = Fp.mul(h, h);
	const h3 = Fp.mul(h2, h);
	const u1h2 = Fp.mul(u1, h2);

	const r2 = Fp.mul(r, r);
	const two_u1h2 = Fp.mul(u1h2, 2n);
	const x_result = Fp.sub(Fp.sub(r2, h3), two_u1h2);

	const y_result = Fp.sub(Fp.mul(r, Fp.sub(u1h2, x_result)), Fp.mul(s1, h3));
	const z_result = Fp.mul(Fp.mul(point.z, other.z), h);

	return /** @type {import('../BrandedG1Point.js').BrandedG1Point} */ ({
		x: x_result,
		y: y_result,
		z: z_result,
	});
}
