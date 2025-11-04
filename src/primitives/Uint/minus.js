import { MAX } from "./constants.js";

/**
 * Subtract Uint256 value with wrapping
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} Difference (uint - b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(50n);
 * const diff1 = Uint.minus(a, b); // 50
 * const diff2 = a.minus(b); // 50
 * ```
 */
export function minus(uint, b) {
	const diff = uint - b;
	if (diff < 0n) {
		return MAX + 1n + diff;
	}
	return diff;
}
