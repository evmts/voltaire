/**
 * Check if G1 point is at infinity
 *
 * @param {import('../BrandedG1Point.js').BrandedG1Point} point - Point to check
 * @returns {boolean} True if at infinity
 *
 * @example
 * ```typescript
 * if (isZero(point)) { }
 * ```
 */
export function isZero(point) {
	return point.z === 0n;
}
