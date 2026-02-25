/**
 * Hex-prefix encoding for MPT paths (Yellow Paper Appendix C).
 *
 * Encodes nibble path with a flag indicating leaf vs extension.
 * Format:
 *   - If odd nibbles: first byte = (flag ? 0x3 : 0x1) << 4 | first_nibble, then remaining pairs
 *   - If even nibbles: first byte = (flag ? 0x20 : 0x00), then all pairs
 *
 * @param {Uint8Array} nibbles - Path nibbles to encode
 * @param {boolean} isLeaf - True for leaf nodes, false for extension nodes
 * @returns {Uint8Array} Hex-prefix encoded path
 */
export function encodePath(nibbles: Uint8Array, isLeaf: boolean): Uint8Array;
/**
 * Decode a hex-prefix encoded path back to nibbles + leaf flag.
 *
 * @param {Uint8Array} encoded - Hex-prefix encoded path
 * @returns {{ nibbles: Uint8Array; isLeaf: boolean }}
 */
export function decodePath(encoded: Uint8Array): {
    nibbles: Uint8Array;
    isLeaf: boolean;
};
//# sourceMappingURL=encodePath.d.ts.map