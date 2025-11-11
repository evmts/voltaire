import { mod } from "./mod.js";
import { mul } from "./mul.js";

/**
 * Exponentiation in Fp using square-and-multiply
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} base - Base element
 * @param {bigint} exponent - Exponent
 * @returns {bigint} base^exponent mod FP_MOD
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fp from './crypto/bn254/Fp/index.js';
 * const result = Fp.pow(2n, 256n);
 * ```
 */
export function pow(base, exponent) {
	let result = 1n;
	let b = mod(base);
	let exp = exponent;
	while (exp > 0n) {
		if (exp & 1n) {
			result = mul(result, b);
		}
		b = mul(b, b);
		exp >>= 1n;
	}
	return result;
}
