/**
 * Convert Uint256 to bigint
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to convert
 * @returns {bigint} bigint value
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const bigint1 = Uint.toBigInt(value);
 * const bigint2 = value.toBigInt();
 * ```
 */
export function toBigInt(uint) {
	return uint;
}
