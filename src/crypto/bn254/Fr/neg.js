import { FR_MOD } from "../constants.js";

/**
 * Negate scalar field element
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - Element to negate
 * @returns {bigint} -a mod FR_MOD
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fr from './crypto/bn254/Fr/index.js';
 * const negated = Fr.neg(123n);
 * ```
 */
export function neg(a) {
	return a === 0n ? 0n : FR_MOD - a;
}
