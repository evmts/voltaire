/**
 * Create Int32 from bytes (big-endian, two's complement)
 *
 * @param {Uint8Array} bytes - Bytes to convert (up to 4 bytes)
 * @returns {import('./BrandedInt32.js').BrandedInt32} Int32 value
 * @throws {Error} If bytes length exceeds 4
 */
export function fromBytes(bytes) {
	if (bytes.length > 4) {
		throw new Error(`Int32 bytes cannot exceed 4 bytes, got ${bytes.length}`);
	}

	// Read as unsigned first
	let value = 0;
	for (let i = 0; i < bytes.length; i++) {
		value = (value << 8) | (bytes[i] ?? 0);
	}

	// For full 4 bytes, use unsigned right shift then bitwise OR for proper sign conversion
	if (bytes.length === 4) {
		value = value | 0;
	} else if (bytes.length > 0) {
		// Sign extend if necessary for partial bytes
		const signBit = bytes.length * 8 - 1;
		if (value & (1 << signBit)) {
			// Negative number - extend sign
			value = value | (~0 << (bytes.length * 8));
		}
		// Truncate to 32-bit signed
		value = value | 0;
	}

	return /** @type {import('./BrandedInt32.js').BrandedInt32} */ (value);
}
