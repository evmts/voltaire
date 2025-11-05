import { MAX } from "./constants.js";

/**
 * Exponentiation
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Base value
 * @param {import('./BrandedUint.js').BrandedUint} exponent - Exponent value
 * @returns {import('./BrandedUint.js').BrandedUint} uint^exponent mod 2^256
 *
 * @example
 * ```typescript
 * const base = Uint(2n);
 * const exp = Uint(8n);
 * const result1 = Uint.toPower(base, exp); // 256
 * const result2 = base.toPower(exp); // 256
 * ```
 */
export function toPower(uint, exponent) {
	let result = 1n;
	let b = uint;
	let e = exponent;

	while (e > 0n) {
		if (e & 1n) {
			result = (result * b) & MAX;
		}
		b = (b * b) & MAX;
		e = e >> 1n;
	}

	return result;
}
