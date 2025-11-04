import * as Fp2 from "../Fp2/index.js";
import { Bn254InvalidPointError, Bn254SubgroupCheckError } from "../errors.js";
import { isInSubgroup } from "./isInSubgroup.js";
import { isOnCurve } from "./isOnCurve.js";

/**
 * Create G2 point from affine coordinates with validation
 *
 * @param {import('../Fp2.js').Fp2} x - X coordinate (Fp2 element)
 * @param {import('../Fp2.js').Fp2} y - Y coordinate (Fp2 element)
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} G2 point
 * @throws {Bn254InvalidPointError} If point not on curve
 * @throws {Bn254SubgroupCheckError} If point not in subgroup
 *
 * @example
 * ```typescript
 * const point = fromAffine({c0: 1n, c1: 2n}, {c0: 3n, c1: 4n});
 * ```
 */
export function fromAffine(x, y) {
	const point = /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
		x,
		y,
		z: Fp2.ONE,
	});

	if (!isOnCurve(point)) {
		throw new Bn254InvalidPointError("Point not on G2 curve");
	}
	if (!isInSubgroup(point)) {
		throw new Bn254SubgroupCheckError("Point not in G2 subgroup");
	}
	return point;
}
