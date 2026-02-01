import * as Address from "../Address/internal-index.js";
/**
 * Check if two Paymaster addresses are equal
 *
 * @param {import('./PaymasterType.js').PaymasterType} a - First Paymaster
 * @param {import('./PaymasterType.js').PaymasterType} b - Second Paymaster
 * @returns {boolean} True if addresses are equal
 *
 * @example
 * ```typescript
 * const isEqual = Paymaster.equals(paymaster1, paymaster2);
 * ```
 */
export function equals(a, b) {
    return Address.equals(
    /** @type {import('../Address/AddressType.js').AddressType} */ (
    /** @type {unknown} */ (a)), 
    /** @type {import('../Address/AddressType.js').AddressType} */ (
    /** @type {unknown} */ (b)));
}
