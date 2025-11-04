import { MAX } from "./constants.js";

/**
 * Add Uint256 value with wrapping
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} Sum (uint + b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(50n);
 * const sum1 = Uint.plus(a, b); // 150
 * const sum2 = a.plus(b); // 150
 * ```
 */
export function plus(uint, b) {
	const sum = uint + b;
	return sum & MAX;
}
