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
export function fromAbiEncoded(bytes: Uint8Array): import("./AddressType.js").AddressType;
//# sourceMappingURL=fromAbiEncoded.d.ts.map