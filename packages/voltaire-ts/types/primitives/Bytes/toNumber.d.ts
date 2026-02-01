/**
 * Convert Bytes to number
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to convert
 * @returns {number} Number value
 * @throws {BytesTooLargeError} If bytes are too large to convert safely
 * @throws {UnsafeIntegerError} If value exceeds MAX_SAFE_INTEGER
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.toNumber(new Uint8Array([0xff]));       // 255
 * Bytes.toNumber(new Uint8Array([0x12, 0x34])); // 4660
 * ```
 */
export function toNumber(bytes: import("./BytesType.js").BytesType): number;
//# sourceMappingURL=toNumber.d.ts.map