import * as Fp2 from "../Fp2/index.js";
import { double } from "./double.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Add two G2 points
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - First point
 * @param {import('../BrandedG2Point.js').BrandedG2Point} other - Second point
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Sum
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const p1 = G2.generator();
 * const p2 = G2.double(p1);
 * const sum = G2.add(p1, p2);
 * ```
 */
export function add(point, other) {
	if (isZero(point)) return other;
	if (isZero(other)) return point;

	const z1_2 = Fp2.square(point.z);
	const z2_2 = Fp2.square(other.z);
	const u1 = Fp2.mul(point.x, z2_2);
	const u2 = Fp2.mul(other.x, z1_2);

	const z1_3 = Fp2.mul(z1_2, point.z);
	const z2_3 = Fp2.mul(z2_2, other.z);
	const s1 = Fp2.mul(point.y, z2_3);
	const s2 = Fp2.mul(other.y, z1_3);

	if (Fp2.equal(u1, u2)) {
		if (Fp2.equal(s1, s2)) {
			return double(point);
		}
		return infinity();
	}

	const h = Fp2.sub(u2, u1);
	const r = Fp2.sub(s2, s1);

	const h2 = Fp2.square(h);
	const h3 = Fp2.mul(h2, h);
	const u1h2 = Fp2.mul(u1, h2);

	const r2 = Fp2.square(r);
	const two_u1h2 = Fp2.mulScalar(u1h2, 2n);
	const x_result = Fp2.sub(Fp2.sub(r2, h3), two_u1h2);

	const y_result = Fp2.sub(
		Fp2.mul(r, Fp2.sub(u1h2, x_result)),
		Fp2.mul(s1, h3),
	);
	const z_result = Fp2.mul(Fp2.mul(point.z, other.z), h);

	return /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
		x: x_result,
		y: y_result,
		z: z_result,
	});
}
