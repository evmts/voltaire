/**
 * Create Bytes from UTF-8 string
 *
 * @param {string} str - UTF-8 string
 * @returns {import('./BytesType.js').BytesType} Bytes
 *
 * @example
 * ```typescript
 * const bytes = Bytes.fromString("hello");
 * // Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f])
 * ```
 */
export function fromString(str) {
    const encoder = new TextEncoder();
    return /** @type {import('./BytesType.js').BytesType} */ (encoder.encode(str));
}
