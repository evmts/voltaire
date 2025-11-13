/**
 * Create Int64 from bytes (big-endian, two's complement)
 *
 * @param {Uint8Array} bytes - Bytes to convert (up to 8 bytes)
 * @returns {import('./BrandedInt64.js').BrandedInt64} Int64 value
 * @throws {Error} If bytes length exceeds 8
 */
export function fromBytes(bytes) {
	if (bytes.length > 8) {
		throw new Error(`Int64 bytes cannot exceed 8 bytes, got ${bytes.length}`);
	}

	// Read as unsigned first
	let value = 0n;
	for (let i = 0; i < bytes.length; i++) {
		value = (value << 8n) | BigInt(bytes[i] ?? 0);
	}

	// Sign extend if necessary
	if (bytes.length > 0) {
		const signBit = BigInt(bytes.length * 8 - 1);
		if (value & (1n << signBit)) {
			// Negative number - extend sign
			const mask = -1n << (BigInt(bytes.length) * 8n);
			value = value | mask;
		}
	}

	return /** @type {import('./BrandedInt64.js').BrandedInt64} */ (value);
}
