import { mod } from "./mod.js";

/**
 * Subtract two field elements in Fp
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - First element
 * @param {bigint} b - Second element
 * @returns {bigint} (a - b) mod FP_MOD
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp from './crypto/bn254/Fp/index.js';
 * const diff = Fp.sub(456n, 123n);
 * ```
 */
export function sub(a, b) {
	return mod(a - b);
}
