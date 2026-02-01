import * as Address from "../Address/internal-index.js";
/**
 * Convert EntryPoint to hex string
 *
 * @param {import('./EntryPointType.js').EntryPointType} entryPoint - EntryPoint address
 * @returns {string} Hex string (0x-prefixed)
 *
 * @example
 * ```typescript
 * const hex = EntryPoint.toHex(entryPoint);
 * console.log(hex); // "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789"
 * ```
 */
export function toHex(entryPoint) {
    return Address.toHex(/** @type {*} */ (entryPoint));
}
