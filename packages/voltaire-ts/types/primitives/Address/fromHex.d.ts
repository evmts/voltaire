/**
 * Parse hex string to Address (standard form)
 *
 * @param {string} hex - Hex string with 0x prefix
 * @returns {import('./AddressType.js').AddressType} Address bytes
 * @throws {InvalidHexFormatError} If invalid format or length
 * @throws {InvalidHexStringError} If hex contains invalid characters
 *
 * @example
 * ```typescript
 * const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * ```
 */
export function fromHex(hex: string): import("./AddressType.js").AddressType;
//# sourceMappingURL=fromHex.d.ts.map