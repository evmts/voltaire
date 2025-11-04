/**
 * Encode bytes to standard base64 string
 *
 * Uses standard base64 alphabet (A-Z, a-z, 0-9, +, /)
 * with padding (=)
 *
 * @param {Uint8Array} data - Bytes to encode
 * @returns {string} Base64-encoded string
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([72, 101, 108, 108, 111]);
 * const encoded = Base64.encode(data);
 * // "SGVsbG8="
 * ```
 */
export function encode(data) {
	let binary = "";
	for (let i = 0; i < data.length; i++) {
		binary += String.fromCharCode(data[i]);
	}
	return btoa(binary);
}
