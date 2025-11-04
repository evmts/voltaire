import * as Fp2 from "../Fp2/index.js";

/**
 * Point at infinity for G2
 *
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Point at infinity
 *
 * @example
 * ```typescript
 * const inf = infinity();
 * ```
 */
export function infinity() {
	return /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
		x: Fp2.ZERO,
		y: Fp2.ZERO,
		z: Fp2.ZERO,
	});
}
