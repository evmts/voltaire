import { FP_MOD } from "../constants.js";

/**
 * Negate a field element in Fp
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - Element to negate
 * @returns {bigint} -a mod FP_MOD
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp from './crypto/bn254/Fp/index.js';
 * const negated = Fp.neg(123n);
 * ```
 */
export function neg(a) {
	return a === 0n ? 0n : FP_MOD - a;
}
