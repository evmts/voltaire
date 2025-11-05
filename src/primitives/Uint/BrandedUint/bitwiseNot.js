import { MAX } from "./constants.js";

/**
 * Bitwise NOT (256-bit)
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to invert
 * @returns {import('./BrandedUint.js').BrandedUint} ~uint (masked to 256 bits)
 *
 * @example
 * ```typescript
 * const a = Uint(0n);
 * const result1 = Uint.bitwiseNot(a); // MAX
 * const result2 = a.bitwiseNot(); // MAX
 * ```
 */
export function bitwiseNot(uint) {
	return MAX ^ uint;
}
