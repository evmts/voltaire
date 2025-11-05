import { decode } from "./decode.js";

/**
 * Decode base64 string to UTF-8 string
 *
 * @param {string} encoded - Base64 string
 * @returns {string} Decoded string
 *
 * @example
 * ```typescript
 * const str = Base64.decodeToString('SGVsbG8=');
 * // "Hello"
 * ```
 */
export function decodeToString(encoded) {
	const decoder = new TextDecoder();
	return decoder.decode(decode(encoded));
}
