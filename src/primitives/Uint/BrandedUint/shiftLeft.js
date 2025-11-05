import { MAX } from "./constants.js";

/**
 * Left shift
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to shift
 * @param {import('./BrandedUint.js').BrandedUint} bits - Number of bits to shift
 * @returns {import('./BrandedUint.js').BrandedUint} uint << bits (mod 2^256)
 *
 * @example
 * ```typescript
 * const a = Uint(1n);
 * const b = Uint(8n);
 * const result1 = Uint.shiftLeft(a, b); // 256
 * const result2 = a.shiftLeft(b); // 256
 * ```
 */
export function shiftLeft(uint, bits) {
	const shifted = uint << bits;
	return shifted & MAX;
}
