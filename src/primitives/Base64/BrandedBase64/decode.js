/**
 * Decode standard base64 string to bytes
 *
 * @param {string} encoded - Base64 string to decode
 * @returns {Uint8Array} Decoded bytes
 * @throws {Error} If input is invalid base64
 *
 * @example
 * ```typescript
 * const decoded = Base64.decode('SGVsbG8=');
 * // Uint8Array([72, 101, 108, 108, 111])
 * ```
 */
export function decode(encoded) {
	try {
		const binary = atob(encoded);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	} catch (error) {
		throw new Error(`Invalid base64: ${error}`);
	}
}
