import { InvalidAbiEncodedPaddingError, InvalidAddressLengthError, } from "./errors.js";
/**
 * Decode Address from ABI-encoded bytes (32 bytes)
 *
 * Extracts the last 20 bytes from 32-byte ABI-encoded address data.
 * Validates that the first 12 padding bytes are all zeros per ABI spec.
 *
 * @param {Uint8Array} bytes - 32-byte ABI-encoded data
 * @returns {import('./AddressType.js').AddressType} Decoded Address
 * @throws {InvalidAddressLengthError} If bytes length is not 32
 * @throws {InvalidAbiEncodedPaddingError} If first 12 bytes are not all zeros
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
        throw new InvalidAddressLengthError(`ABI-encoded Address must be exactly 32 bytes, got ${bytes.length}`, {
            value: bytes.length,
            expected: "32 bytes",
            code: -32602,
        });
    }
    // Validate first 12 bytes are zeros per ABI spec
    for (let i = 0; i < 12; i++) {
        const byte = /** @type {number} */ (bytes[i]);
        if (byte !== 0) {
            throw new InvalidAbiEncodedPaddingError(`ABI-encoded address has non-zero byte at position ${i}: 0x${byte.toString(16).padStart(2, "0")}`, {
                value: bytes,
                expected: "First 12 bytes must be zero",
                context: { position: i, byte },
            });
        }
    }
    return /** @type {import('./AddressType.js').AddressType} */ (bytes.slice(12, 32));
}
