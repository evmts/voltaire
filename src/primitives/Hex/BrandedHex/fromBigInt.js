/**
 * Convert bigint to hex
 *
 * @param {bigint} value - BigInt to convert
 * @param {number} [size] - Optional byte size for padding
 * @returns {import('./BrandedHex.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * Hex.fromBigInt(255n);      // '0xff'
 * Hex.fromBigInt(255n, 32);  // '0x00...00ff' (32 bytes)
 * ```
 */
export function fromBigInt(value, size) {
	let hex = value.toString(16);
	if (size !== undefined) {
		hex = hex.padStart(size * 2, "0");
	}
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (`0x${hex}`);
}
