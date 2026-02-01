/**
 * Trim leading zeros from Bytes, preserving at least one byte for zero values
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to trim
 * @returns {import('./BytesType.js').BytesType} Trimmed bytes (at least 1 byte if input was non-empty)
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.trimLeft(new Uint8Array([0x00, 0x00, 0x12, 0x34])); // Uint8Array([0x12, 0x34])
 * Bytes.trimLeft(new Uint8Array([0x00, 0x00, 0x00]));       // Uint8Array([0x00])
 * Bytes.trimLeft(new Uint8Array([]));                       // Uint8Array([])
 * ```
 */
export function trimLeft(bytes: import("./BytesType.js").BytesType): import("./BytesType.js").BytesType;
//# sourceMappingURL=trimLeft.d.ts.map