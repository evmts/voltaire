import { FP_MOD } from "../constants.js";

/**
 * Reduce element modulo field modulus Fp
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - Element to reduce
 * @returns {bigint} Result in range [0, FP_MOD)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp from './crypto/bn254/Fp/index.js';
 * const result = Fp.mod(123456789n);
 * ```
 */
export function mod(a) {
	const result = a % FP_MOD;
	return result < 0n ? result + FP_MOD : result;
}
