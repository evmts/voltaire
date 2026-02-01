import { mod } from "./mod.js";

/**
 * Multiply two scalar field elements
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - First element
 * @param {bigint} b - Second element
 * @returns {bigint} (a * b) mod FR_MOD
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fr from './crypto/bn254/Fr/index.js';
 * const product = Fr.mul(123n, 456n);
 * ```
 */
export function mul(a, b) {
	return mod(a * b);
}
