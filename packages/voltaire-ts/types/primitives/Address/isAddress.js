import { SIZE } from "./constants.js";
/**
 * Type guard for Address
 *
 * @see https://voltaire.tevm.sh/primitives/address for Address documentation
 * @since 0.1.42
 * @param {unknown} value - Value to check
 * @returns {value is import('./AddressType.js').AddressType} True if value is an Address
 * @throws {never}
 * @example
 * ```typescript
 * import { isAddress } from '@tevm/voltaire';
 * if (isAddress(value)) {
 *   const hex = Address.toHex(value);
 * }
 * ```
 */
export function isAddress(value) {
    return value instanceof Uint8Array && value.length === SIZE;
}
