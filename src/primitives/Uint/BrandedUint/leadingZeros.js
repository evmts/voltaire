import { bitLength } from "./bitLength.js";

/**
 * Get number of leading zero bits
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to check
 * @returns {number} Number of leading zeros (0-256)
 *
 * @example
 * ```typescript
 * const a = Uint(1n);
 * const zeros1 = Uint.leadingZeros(a); // 255
 * const zeros2 = a.leadingZeros(); // 255
 * ```
 */
export function leadingZeros(uint) {
	return 256 - bitLength(uint);
}
