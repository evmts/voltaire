/**
 * Create Address from raw bytes (standard form)
 *
 * @param {Uint8Array} bytes - Raw 20-byte array
 * @returns {import('./AddressType.js').AddressType} Address
 * @throws {InvalidAddressLengthError} If length is not 20 bytes
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array(20);
 * const addr = Address.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./AddressType.js").AddressType;
//# sourceMappingURL=fromBytes.d.ts.map