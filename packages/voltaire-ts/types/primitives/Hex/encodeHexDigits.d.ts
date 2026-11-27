/**
 * Encode bytes as lowercase hex digits without a `0x` prefix.
 *
 * @internal
 * @param {ArrayLike<number>} bytes - Bytes to encode (values 0-255)
 * @returns {string} Lowercase hex digits, two per byte
 * @example
 * ```javascript
 * encodeHexDigits(new Uint8Array([0x12, 0xab])); // "12ab"
 * ```
 */
export function encodeHexDigits(bytes: ArrayLike<number>): string;
//# sourceMappingURL=encodeHexDigits.d.ts.map