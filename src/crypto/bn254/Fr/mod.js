import { FR_MOD } from "../constants.js";

/**
 * Reduce element modulo scalar field modulus Fr
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - Element to reduce
 * @returns {bigint} Result in range [0, FR_MOD)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fr from './crypto/bn254/Fr/index.js';
 * const result = Fr.mod(123456789n);
 * ```
 */
export function mod(a) {
	const result = a % FR_MOD;
	return result < 0n ? result + FR_MOD : result;
}
