import { G1_GENERATOR_X, G1_GENERATOR_Y } from "../constants.js";

/**
 * G1 generator point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @returns {import('../BrandedG1Point.js').BrandedG1Point} Generator point
 * @throws {never}
 * @example
 * ```javascript
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const g = G1.generator();
 * ```
 */
export function generator() {
	return /** @type {import('../BrandedG1Point.js').BrandedG1Point} */ ({
		x: G1_GENERATOR_X,
		y: G1_GENERATOR_Y,
		z: 1n,
	});
}
