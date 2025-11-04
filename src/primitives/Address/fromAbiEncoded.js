/**
 * Decode Address from ABI-encoded bytes (32 bytes)
 *
 * Extracts the last 20 bytes from 32-byte ABI-encoded address data.
 *
 * @param {Uint8Array} bytes - 32-byte ABI-encoded data
 * @returns {import('./BrandedAddress.js').BrandedAddress} Decoded Address
 * @throws {Error} If bytes length is not 32
 *
 * @example
 * ```typescript
 * const encoded = new Uint8Array(32);
 * // ... set encoded[12:32] to address bytes ...
 * const addr = Address.fromAbiEncoded(encoded);
 * ```
 */
export function fromAbiEncoded(bytes) {
	if (bytes.length !== 32) {
		throw new Error(
			`ABI-encoded Address must be exactly 32 bytes, got ${bytes.length}`,
		);
	}
	return /** @type {import('./BrandedAddress.js').BrandedAddress} */ (
		bytes.slice(12, 32)
	);
}
