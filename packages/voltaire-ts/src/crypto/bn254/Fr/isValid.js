import { FR_MOD } from "../constants.js";

/**
 * Check if scalar is valid (in range [0, FR_MOD))
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} scalar - Scalar to check
 * @returns {boolean} True if valid
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fr from './crypto/bn254/Fr/index.js';
 * if (Fr.isValid(scalar)) {
 *   console.log('Scalar is valid');
 * }
 * ```
 */
export function isValid(scalar) {
	return scalar >= 0n && scalar < FR_MOD;
}
