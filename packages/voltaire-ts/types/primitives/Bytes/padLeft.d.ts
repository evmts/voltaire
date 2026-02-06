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
export function padLeft(bytes: import("./BytesType.js").BytesType, targetSize: number): import("./BytesType.js").BytesType;
//# sourceMappingURL=padLeft.d.ts.map