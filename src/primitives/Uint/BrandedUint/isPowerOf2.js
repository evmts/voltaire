import { ZERO } from "./constants.js";

/**
 * Check if value is a power of 2
 *
 * @param {import('./BrandedUint.ts').BrandedUint} value - Value to check
 * @returns {boolean} True if value is power of 2
 *
 * @example
 * ```typescript
 * Uint.isPowerOf2(Uint(16n)); // true
 * Uint.isPowerOf2(Uint(15n)); // false
 * ```
 */
export function isPowerOf2(value) {
	return value !== ZERO && (value & (value - 1n)) === ZERO;
}
