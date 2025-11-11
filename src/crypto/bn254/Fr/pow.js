import { mod } from "./mod.js";
import { mul } from "./mul.js";

/**
 * Exponentiation in Fr using square-and-multiply
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {bigint} base - Base element
 * @param {bigint} exponent - Exponent
 * @returns {bigint} base^exponent mod FR_MOD
 * @throws {never}
 * @example
 * ```javascript
 * import * as Fr from './crypto/bn254/Fr/index.js';
 * const result = Fr.pow(2n, 256n);
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
