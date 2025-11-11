import { FP_MOD } from "../constants.js";
import { mod } from "./mod.js";
import { mul } from "./mul.js";
import { pow } from "./pow.js";

/**
 * Compute square root in Fp (if it exists)
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} a - Element to take square root of
 * @returns {bigint | null} Square root if it exists, null otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp from './crypto/bn254/Fp/index.js';
 * const root = Fp.sqrt(4n);
 * if (root !== null) {
 *   console.log('Square root:', root);
 * }
 * ```
 */
export function sqrt(a) {
	const a_mod = mod(a);
	const exp = (FP_MOD + 1n) / 4n;
	const result = pow(a_mod, exp);
	if (mul(result, result) !== a_mod) return null;
	return result;
}
