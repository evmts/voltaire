/**
 * Convert Bytes8 to hex string
 *
 * @param {import('./Bytes8Type.js').Bytes8Type} bytes - Bytes8 to convert
 * @returns {import('../../Hex/index.js').HexType} Hex string
 *
 * @example
 * ```typescript
 * const hex = Bytes8.toHex(bytes);
 * ```
 */
export function toHex(bytes) {
    return /** @type {import('../../Hex/index.js').HexType} */ (`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`);
}
