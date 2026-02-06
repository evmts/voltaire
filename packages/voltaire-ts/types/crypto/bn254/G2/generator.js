import { G2_GENERATOR_X_C0, G2_GENERATOR_X_C1, G2_GENERATOR_Y_C0, G2_GENERATOR_Y_C1, } from "../constants.js";
import * as Fp2 from "../Fp2/index.js";
/**
 * G2 generator point
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @returns {import('../G2PointType.js').G2PointType} Generator point
 * @throws {never}
 * @example
 * ```javascript
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const g = G2.generator();
 * ```
 */
export function generator() {
    return /** @type {import('../G2PointType.js').G2PointType} */ ({
        x: Fp2.create(G2_GENERATOR_X_C0, G2_GENERATOR_X_C1),
        y: Fp2.create(G2_GENERATOR_Y_C0, G2_GENERATOR_Y_C1),
        z: Fp2.ONE,
    });
}
