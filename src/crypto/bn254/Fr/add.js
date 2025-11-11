import { mod } from "./mod.js";

/**
 * Add two scalar field elements
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - First element
 * @param {bigint} b - Second element
 * @returns {bigint} (a + b) mod FR_MOD
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fr from './crypto/bn254/Fr/index.js';
 * const sum = Fr.add(123n, 456n);
 * ```
 */
export function add(a, b) {
	return mod(a + b);
}
