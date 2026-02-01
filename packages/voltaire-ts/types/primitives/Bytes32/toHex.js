/**
 * Convert Bytes32 to hex string with 0x prefix
 *
 * @param {import('./Bytes32Type.js').Bytes32Type} bytes32 - Bytes32 to convert
 * @returns {string} Lowercase hex string with 0x prefix (66 chars total)
 *
 * @example
 * ```typescript
 * const hex = Bytes32.toHex(b32);
 * // "0x000000000000000000000000000000000000000000000000000000000000002a"
 * ```
 */
export function toHex(bytes32) {
    return `0x${Array.from(bytes32, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}
