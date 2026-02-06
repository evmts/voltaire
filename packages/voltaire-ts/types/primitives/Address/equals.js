import { equalsConstantTime } from "../Bytes/equalsConstantTime.js";
/**
 * Check if two addresses are equal using constant-time comparison
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {import('./AddressType.js').AddressType} address - First address
 * @param {import('./AddressType.js').AddressType} other - Address to compare with
 * @returns {boolean} True if addresses are identical
 *
 * @example
 * ```typescript
 * if (Address.equals(addr1, addr2)) {
 *   console.log("Addresses match");
 * }
 * ```
 */
export function equals(address, other) {
    return equalsConstantTime(address, other);
}
