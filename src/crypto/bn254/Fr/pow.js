import { mod } from "./mod.js";
import { mul } from "./mul.js";

/**
 * Exponentiation in Fr using square-and-multiply
 *
 * @param {bigint} base - Base element
 * @param {bigint} exponent - Exponent
 * @returns {bigint} base^exponent mod FR_MOD
 *
 * @example
 * ```typescript
 * const result = pow(2n, 256n);
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
