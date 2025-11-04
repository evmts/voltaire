import * as Fp from "../Fp/index.js";
import { infinity } from "./infinity.js";
import { isZero } from "./isZero.js";

/**
 * Double a G1 point
 *
 * @param {import('../BrandedG1Point.js').BrandedG1Point} point - Point to double
 * @returns {import('../BrandedG1Point.js').BrandedG1Point} Doubled point
 *
 * @example
 * ```typescript
 * const doubled = double(point);
 * ```
 */
export function double(point) {
	if (isZero(point)) return infinity();

	const x2 = Fp.mul(point.x, point.x);
	const y2 = Fp.mul(point.y, point.y);
	const y4 = Fp.mul(y2, y2);

	const s = Fp.mul(Fp.mul(point.x, y2), 4n);
	const m = Fp.mul(x2, 3n);

	const m2 = Fp.mul(m, m);
	const two_s = Fp.mul(s, 2n);
	const x_result = Fp.sub(m2, two_s);

	const s_minus_x = Fp.sub(s, x_result);
	const eight_y4 = Fp.mul(y4, 8n);
	const y_result = Fp.sub(Fp.mul(m, s_minus_x), eight_y4);

	const z_result = Fp.mul(Fp.mul(point.y, point.z), 2n);

	return /** @type {import('../BrandedG1Point.js').BrandedG1Point} */ ({
		x: x_result,
		y: y_result,
		z: z_result,
	});
}
