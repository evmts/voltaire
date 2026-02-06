/**
 * Encodes a length value as big-endian bytes (no leading zeros)
 * @internal
 *
 * @param {number} length
 * @returns {Uint8Array}
 */
export function encodeLengthValue(length: number): Uint8Array;
/**
 * Decodes a big-endian length value
 * @internal
 *
 * @param {Uint8Array} bytes
 * @returns {number}
 */
export function decodeLengthValue(bytes: Uint8Array): number;
//# sourceMappingURL=utils.d.ts.map