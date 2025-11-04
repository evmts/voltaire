import * as Fp2 from "../Fp2/index.js";

/**
 * Negate G2 point
 *
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point to negate
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Negated point
 *
 * @example
 * ```typescript
 * const neg = negate(point);
 * ```
 */
export function negate(point) {
	return /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
		x: point.x,
		y: Fp2.neg(point.y),
		z: point.z,
	});
}
