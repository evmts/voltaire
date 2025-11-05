/**
 * Convert Uint256 to number
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to convert
 * @returns {number} number value
 * @throws {Error} If value exceeds MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const num1 = Uint.toNumber(value);
 * const num2 = value.toNumber();
 * ```
 */
export function toNumber(uint) {
	if (uint > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new Error(`Uint256 value exceeds MAX_SAFE_INTEGER: ${uint}`);
	}
	return Number(uint);
}
