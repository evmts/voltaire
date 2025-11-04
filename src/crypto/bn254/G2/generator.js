import * as Fp2 from "../Fp2/index.js";
import {
	G2_GENERATOR_X_C0,
	G2_GENERATOR_X_C1,
	G2_GENERATOR_Y_C0,
	G2_GENERATOR_Y_C1,
} from "../constants.js";

/**
 * G2 generator point
 *
 * @returns {import('../BrandedG2Point.js').BrandedG2Point} Generator point
 *
 * @example
 * ```typescript
 * const g = generator();
 * ```
 */
export function generator() {
	return /** @type {import('../BrandedG2Point.js').BrandedG2Point} */ ({
		x: Fp2.create(G2_GENERATOR_X_C0, G2_GENERATOR_X_C1),
		y: Fp2.create(G2_GENERATOR_Y_C0, G2_GENERATOR_Y_C1),
		z: Fp2.ONE,
	});
}
