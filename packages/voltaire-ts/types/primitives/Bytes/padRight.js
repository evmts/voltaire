import { SizeExceededError } from "./errors.js";
/**
 * Pad Bytes on the right (end) with zeros to target size
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to pad
 * @param {number} targetSize - Target size in bytes
 * @returns {import('./BytesType.js').BytesType} Padded bytes
 * @throws {SizeExceededError} If bytes exceeds target size
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.padRight(new Uint8Array([0x12, 0x34]), 4); // Uint8Array([0x12, 0x34, 0x00, 0x00])
 * ```
 */
export function padRight(bytes, targetSize) {
    if (bytes.length > targetSize) {
        throw new SizeExceededError(`Bytes size (${bytes.length}) exceeds padding size (${targetSize}).`, {
            value: bytes,
            expected: `${targetSize} bytes or fewer`,
            context: { actualSize: bytes.length, targetSize },
        });
    }
    if (bytes.length === targetSize) {
        return bytes;
    }
    const result = new Uint8Array(targetSize);
    result.set(bytes, 0);
    return /** @type {import('./BytesType.js').BytesType} */ (result);
}
