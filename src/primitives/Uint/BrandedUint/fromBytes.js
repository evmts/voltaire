/**
 * Create Uint256 from bytes (big-endian)
 *
 * @param {Uint8Array} bytes - bytes to convert
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {Error} If bytes length exceeds 32
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([0xff, 0x00]);
 * const value = Uint.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length > 32) {
		throw new Error(
			`Uint256 bytes cannot exceed 32 bytes, got ${bytes.length}`,
		);
	}

	let value = 0n;
	for (let i = 0; i < bytes.length; i++) {
		value = (value << 8n) | BigInt(bytes[i] ?? 0);
	}

	return value;
}
