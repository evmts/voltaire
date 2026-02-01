/**
 * Check if value is a valid Bytes (Uint8Array)
 *
 * @param {unknown} value - Value to check
 * @returns {value is import('./BytesType.js').BytesType} True if value is Uint8Array
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.isBytes(new Uint8Array([1, 2, 3])); // true
 * Bytes.isBytes([1, 2, 3]);                  // false
 * Bytes.isBytes("0x1234");                   // false
 * ```
 */
export function isBytes(value) {
	return value instanceof Uint8Array;
}
