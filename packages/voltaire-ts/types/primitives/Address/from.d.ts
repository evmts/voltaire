/**
 * Create Address from various input types (universal constructor)
 *
 * @param {number | bigint | string | Uint8Array | number[]} value - Number, bigint, hex string, Uint8Array, or number array
 * @returns {import('./AddressType.js').AddressType} Address
 * @throws {InvalidValueError} If value type is unsupported or invalid
 * @throws {InvalidHexFormatError} If hex string is invalid
 * @throws {InvalidAddressLengthError} If bytes length is not 20
 *
 * @example
 * ```typescript
 * const addr1 = Address.from(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
 * const addr2 = Address.from(12345);
 * const _addr3 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * const addr4 = Address.from(new Uint8Array(20));
 * const addr5 = Address.from([0x74, 0x2d, 0x35, ...]);
 * ```
 */
export function from(value: number | bigint | string | Uint8Array | number[]): import("./AddressType.js").AddressType;
//# sourceMappingURL=from.d.ts.map