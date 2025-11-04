import { G1_GENERATOR_X, G1_GENERATOR_Y } from "../constants.js";

/**
 * G1 generator point
 *
 * @returns {import('../BrandedG1Point.js').BrandedG1Point} Generator point
 *
 * @example
 * ```typescript
 * const g = generator();
 * ```
 */
export function generator() {
	return /** @type {import('../BrandedG1Point.js').BrandedG1Point} */ ({
		x: G1_GENERATOR_X,
		y: G1_GENERATOR_Y,
		z: 1n,
	});
}
