/**
 * Convert Uint256 to bytes (big-endian, 32 bytes)
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to convert
 * @returns {Uint8Array} 32-byte Uint8Array
 *
 * @example
 * ```typescript
 * const value = Uint(255n);
 * const bytes1 = Uint.toBytes(value);
 * const bytes2 = value.toBytes();
 * ```
 */
export function toBytes(uint) {
	const bytes = new Uint8Array(32);
	let val = uint;

	for (let i = 31; i >= 0; i--) {
		bytes[i] = Number(val & 0xffn);
		val = val >> 8n;
	}

	return bytes;
}
