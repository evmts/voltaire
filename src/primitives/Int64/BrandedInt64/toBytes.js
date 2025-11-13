/**
 * Convert Int64 to bytes (big-endian, two's complement, 8 bytes)
 *
 * @param {import('./BrandedInt64.js').BrandedInt64} value - Int64 value
 * @returns {Uint8Array} 8-byte Uint8Array
 */
export function toBytes(value) {
	const bytes = new Uint8Array(8);

	// Convert to unsigned 64-bit for byte extraction
	let unsigned = value < 0n ? (1n << 64n) + value : value;

	for (let i = 7; i >= 0; i--) {
		bytes[i] = Number(unsigned & 0xffn);
		unsigned = unsigned >> 8n;
	}

	return bytes;
}
