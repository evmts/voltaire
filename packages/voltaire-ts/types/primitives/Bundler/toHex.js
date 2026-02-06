import * as Address from "../Address/internal-index.js";
/**
 * Convert Bundler to hex string
 *
 * @param {import('./BundlerType.js').BundlerType} bundler - Bundler address
 * @returns {string} Hex string (0x-prefixed)
 *
 * @example
 * ```typescript
 * const hex = Bundler.toHex(bundler);
 * console.log(hex); // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 */
export function toHex(bundler) {
    return Address.toHex(
    /** @type {import('../Address/AddressType.js').AddressType} */ (
    /** @type {unknown} */ (bundler)));
}
