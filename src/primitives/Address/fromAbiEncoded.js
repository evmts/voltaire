import { InvalidAddressError, InvalidAddressLengthError } from "./errors.js";

/**
 * Decode Address from ABI-encoded bytes (32 bytes)
 *
 * Extracts the last 20 bytes from 32-byte ABI-encoded address data.
 * The first 12 bytes must be zeros (left-padded 20-byte address).
 *
 * @param {Uint8Array} bytes - 32-byte ABI-encoded data
 * @returns {import('./AddressType.js').AddressType} Decoded Address
 * @throws {InvalidAddressLengthError} If bytes length is not 32
 * @throws {InvalidAddressError} If first 12 bytes are not zeros
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
		throw new InvalidAddressLengthError(
			`ABI-encoded Address must be exactly 32 bytes, got ${bytes.length}`,
			{
				value: bytes.length,
				expected: "32 bytes",
				code: "INVALID_ABI_ENCODED_LENGTH",
			},
		);
	}
	// Validate leading 12 bytes are zeros
	for (let i = 0; i < 12; i++) {
		if (bytes[i] !== 0) {
			throw new InvalidAddressError(
				"ABI-encoded Address must have leading 12 bytes as zeros",
				{
					value: bytes,
					expected: "First 12 bytes must be 0x00",
					code: "INVALID_ABI_PADDING",
				},
			);
		}
	}
	return /** @type {import('./AddressType.js').AddressType} */ (
		bytes.slice(12, 32)
	);
}
