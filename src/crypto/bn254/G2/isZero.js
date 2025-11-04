import * as Fp2 from "../Fp2/index.js";

/**
 * Check if G2 point is at infinity
 *
 * @param {import('../BrandedG2Point.js').BrandedG2Point} point - Point to check
 * @returns {boolean} True if at infinity
 *
 * @example
 * ```typescript
 * if (isZero(point)) { }
 * ```
 */
export function isZero(point) {
	return Fp2.isZero(point.z);
}
