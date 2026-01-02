/**
 * Trim ALL leading zeros from Bytes
 *
 * Removes every leading zero byte until a non-zero byte is found.
 * Returns an empty Uint8Array if input contains only zeros.
 *
 * **Warning**: This removes ALL leading zeros, including those that may be
 * significant for fixed-width values (e.g., 32-byte hashes, addresses).
 * For fixed-width contexts, use `padLeft` after trimming to restore length.
 *
 * @param {import('./BytesType.js').BytesType} bytes - Bytes to trim
 * @returns {import('./BytesType.js').BytesType} Trimmed bytes (may be shorter than input)
 *
 * @example
 * ```javascript
 * import * as Bytes from './primitives/Bytes/index.js';
 *
 * // Basic trimming
 * Bytes.trimLeft(new Uint8Array([0x00, 0x00, 0x12, 0x34])); // Uint8Array([0x12, 0x34])
 * Bytes.trimLeft(new Uint8Array([0x00, 0x00, 0x00]));       // Uint8Array([])
 *
 * // Fixed-width restoration (e.g., 32-byte value)
 * const trimmed = Bytes.trimLeft(bytes);
 * const restored = Bytes.padLeft(trimmed, 32); // Restore to 32 bytes
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

	return /** @type {import('./BytesType.js').BytesType} */ (bytes.slice(start));
}
