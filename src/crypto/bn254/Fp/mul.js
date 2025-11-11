import { mod } from "./mod.js";

/**
 * Multiply two field elements in Fp
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - First element
 * @param {bigint} b - Second element
 * @returns {bigint} (a * b) mod FP_MOD
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp from './crypto/bn254/Fp/index.js';
 * const product = Fp.mul(123n, 456n);
 * ```
 */
export function mul(a, b) {
	return mod(a * b);
}
