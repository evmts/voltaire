import * as Fp2 from "../Fp2/index.js";
import { Bn254InvalidPointError, Bn254SubgroupCheckError } from "../errors.js";
import { isInSubgroup } from "./isInSubgroup.js";
import { isOnCurve } from "./isOnCurve.js";

/**
 * Create G2 point from affine coordinates with validation
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('../Fp2.js').Fp2} x - X coordinate (Fp2 element)
 * @param {import('../Fp2.js').Fp2} y - Y coordinate (Fp2 element)
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} G2 point
 * @throws {Bn254InvalidPointError} If point not on curve
 * @throws {Bn254SubgroupCheckError} If point not in subgroup
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * import * as Fp2 from './crypto/bn254/Fp2/index.js';
 * const x = Fp2.create(1n, 2n);
 * const y = Fp2.create(3n, 4n);
 * const point = G2.fromAffine(x, y);
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
