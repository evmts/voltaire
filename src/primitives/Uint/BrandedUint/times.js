import { MAX } from "./constants.js";

/**
 * Multiply Uint256 value with wrapping
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - First operand
 * @param {import('./BrandedUint.js').BrandedUint} b - Second operand
 * @returns {import('./BrandedUint.js').BrandedUint} Product (uint * b) mod 2^256
 *
 * @example
 * ```typescript
 * const a = Uint(10n);
 * const b = Uint(5n);
 * const product1 = Uint.times(a, b); // 50
 * const product2 = a.times(b); // 50
 * ```
 */
export function times(uint, b) {
	const product = uint * b;
	return product & MAX;
}
