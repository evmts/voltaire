/**
 * Create Address from number value (takes lower 160 bits) (standard form)
 *
 * @param {bigint | number} value - Number or bigint value
 * @returns {import('./AddressType.js').AddressType} Address from lower 160 bits
 * @throws {InvalidValueError} If value is negative
 *
 * @example
 * ```typescript
 * const addr = Address.fromNumber(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
 * const addr2 = Address.fromNumber(12345);
 * ```
 */
export function fromNumber(value: bigint | number): import("./AddressType.js").AddressType;
//# sourceMappingURL=fromNumber.d.ts.map