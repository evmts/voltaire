import { SIZE } from "./constants.js";
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
export function is(value) {
    return value instanceof Uint8Array && value.length === SIZE;
}
