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
export function trimRight(bytes: import("./BytesType.js").BytesType): import("./BytesType.js").BytesType;
//# sourceMappingURL=trimRight.d.ts.map