/**
 * Point at infinity for G1
 *
 * @returns {import('../BrandedG1Point.js').BrandedG1Point} Point at infinity
 *
 * @example
 * ```typescript
 * const inf = infinity();
 * ```
 */
export function infinity() {
	return /** @type {import('../BrandedG1Point.js').BrandedG1Point} */ ({
		x: 0n,
		y: 0n,
		z: 0n,
	});
}
