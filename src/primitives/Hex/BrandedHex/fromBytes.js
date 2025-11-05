/**
 * Convert bytes to hex
 *
 * @param {Uint8Array} bytes - Byte array to convert
 * @returns {import('./BrandedHex.js').BrandedHex} Hex string
 *
 * @example
 * ```typescript
 * const hex = Hex.fromBytes(new Uint8Array([0x12, 0x34])); // '0x1234'
 * ```
 */
export function fromBytes(bytes) {
	const hexChars = "0123456789abcdef";
	let result = "0x";
	for (let i = 0; i < bytes.length; i++) {
		const b = bytes[i];
		result += hexChars[b >> 4] + hexChars[b & 0x0f];
	}
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (result);
}
