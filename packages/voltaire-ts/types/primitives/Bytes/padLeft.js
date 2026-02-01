import { SizeExceededError } from "./errors.js";
/**
 * Pad Bytes on the left (start) with zeros to target size
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to pad
 * @param {number} targetSize - Target size in bytes
 * @returns {import('./BytesType.js').BytesType} Padded bytes
 * @throws {SizeExceededError} If bytes exceeds target size
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.padLeft(new Uint8Array([0x12, 0x34]), 4); // Uint8Array([0x00, 0x00, 0x12, 0x34])
 * ```
 */
export function padLeft(bytes, targetSize) {
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
    result.set(bytes, targetSize - bytes.length);
    return /** @type {import('./BytesType.js').BytesType} */ (result);
}
