import * as Fp2 from "../Fp2/index.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Double a G2 point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point to double
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Doubled point
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * const doubled = G2.double(point);
 * ```
 */
export function double(point) {
	if (isZero(point)) return infinity();

	const x2 = Fp2.square(point.x);
	const y2 = Fp2.square(point.y);
	const y4 = Fp2.square(y2);

	const s = Fp2.mulScalar(Fp2.mul(point.x, y2), 4n);
	const m = Fp2.mulScalar(x2, 3n);

	const m2 = Fp2.square(m);
	const two_s = Fp2.mulScalar(s, 2n);
	const x_result = Fp2.sub(m2, two_s);

	const s_minus_x = Fp2.sub(s, x_result);
	const eight_y4 = Fp2.mulScalar(y4, 8n);
	const y_result = Fp2.sub(Fp2.mul(m, s_minus_x), eight_y4);

	const z_result = Fp2.mulScalar(Fp2.mul(point.y, point.z), 2n);

	return /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
		x: x_result,
		y: y_result,
		z: z_result,
	});
}
