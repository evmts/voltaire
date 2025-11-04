import * as Fp from "../Fp/index.js";

/**
 * Negate G1 point
 *
 * @param {import('../BrandedG1Point.js').BrandedG1Point} point - Point to negate
 * @returns {import('../BrandedG1Point.js').BrandedG1Point} Negated point
 *
 * @example
 * ```typescript
 * const neg = negate(point);
 * ```
 */
export function negate(point) {
	return /** @type {import('../BrandedG1Point.js').BrandedG1Point} */ ({
		x: point.x,
		y: Fp.neg(point.y),
		z: point.z,
	});
}
