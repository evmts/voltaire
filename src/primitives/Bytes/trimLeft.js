/**
 * Trim leading zeros from Bytes
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to trim
 * @returns {import('./BytesType.js').BytesType} Trimmed bytes
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 * Bytes.trimLeft(new Uint8Array([0x00, 0x00, 0x12, 0x34])); // Uint8Array([0x12, 0x34])
 * Bytes.trimLeft(new Uint8Array([0x00, 0x00, 0x00]));       // Uint8Array([])
 * ```
 */
export function trimLeft(bytes) {
	let start = 0;
	while (start < bytes.length && bytes[start] === 0) {
		start++;
	}

	if (start === 0) {
		return bytes;
	}

	return /** @type {import('./BytesType.js').BytesType} */ (
		bytes.slice(start)
	);
}
