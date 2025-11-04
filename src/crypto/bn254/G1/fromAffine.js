import * as Fp from "../Fp/index.js";
import { B_G1 } from "../constants.js";
import { Bn254InvalidPointError } from "../errors.js";

/**
 * Create G1 point from affine coordinates with validation
 *
 * @param {bigint} x - X coordinate
 * @param {bigint} y - Y coordinate
 * @returns {import('../BrandedG1Point.js').BrandedG1Point} G1 point
 * @throws {Bn254InvalidPointError} If point not on curve
 *
 * @example
 * ```typescript
 * const point = fromAffine(1n, 2n);
 * ```
 */
export function fromAffine(x, y) {
	const x_mod = Fp.mod(x);
	const y_mod = Fp.mod(y);

	const y2 = Fp.mul(y_mod, y_mod);
	const x3 = Fp.mul(Fp.mul(x_mod, x_mod), x_mod);
	const rhs = Fp.add(x3, B_G1);

	if (y2 !== rhs) {
		throw new Bn254InvalidPointError("Point not on G1 curve");
	}

	return /** @type {import('../BrandedG1Point.js').BrandedG1Point} */ ({
		x: x_mod,
		y: y_mod,
		z: 1n,
	});
}
