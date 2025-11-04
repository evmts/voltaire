/**
 * Convert hex to bigint
 *
 * @param {import('./BrandedHex.js').BrandedHex} hex - Hex string to convert
 * @returns {bigint} BigInt value
 *
 * @example
 * ```typescript
 * const hex = Hex('0xff');
 * const big1 = Hex.toBigInt(hex); // 255n
 * const big2 = hex.toBigInt(); // 255n
 * ```
 */
export function toBigInt(hex) {
	return BigInt(hex);
}
