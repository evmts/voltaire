/**
 * Type guard for Address (standard form)
 *
 * @param {unknown} value - Value to check
 * @returns {value is import('./AddressType.js').AddressType} True if value is an Address
 *
 * @example
 * ```typescript
 * if (Address.is(value)) {
 *   const hex = Address.toHex(value);
 * }
 * ```
 */
export function is(value: unknown): value is import("./AddressType.js").AddressType;
//# sourceMappingURL=is.d.ts.map