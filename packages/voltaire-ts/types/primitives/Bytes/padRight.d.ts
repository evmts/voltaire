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
export function padRight(bytes: import("./BytesType.js").BytesType, targetSize: number): import("./BytesType.js").BytesType;
//# sourceMappingURL=padRight.d.ts.map