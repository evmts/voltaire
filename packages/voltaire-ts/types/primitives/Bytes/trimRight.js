/**
 * Trim trailing zeros from Bytes
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to trim
 * @returns {import('./BytesType.js').BytesType} Trimmed bytes
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.trimRight(new Uint8Array([0x12, 0x34, 0x00, 0x00])); // Uint8Array([0x12, 0x34])
 * Bytes.trimRight(new Uint8Array([0x00, 0x00, 0x00]));       // Uint8Array([])
 * ```
 */
export function trimRight(bytes) {
    let end = bytes.length;
    while (end > 0 && bytes[end - 1] === 0) {
        end--;
    }
    if (end === bytes.length) {
        return bytes;
    }
    return /** @type {import('./BytesType.js').BytesType} */ (bytes.slice(0, end));
}
