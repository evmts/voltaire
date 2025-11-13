/**
 * Convert Int32 to bytes (big-endian, two's complement, 4 bytes)
 *
 * @param {import('./BrandedInt32.js').BrandedInt32} value - Int32 value
 * @returns {Uint8Array} 4-byte Uint8Array
 */
export function toBytes(value) {
	const bytes = new Uint8Array(4);

	// Convert to unsigned 32-bit for byte extraction
	const unsigned = value >>> 0;

	bytes[0] = (unsigned >> 24) & 0xff;
	bytes[1] = (unsigned >> 16) & 0xff;
	bytes[2] = (unsigned >> 8) & 0xff;
	bytes[3] = unsigned & 0xff;

	return bytes;
}
