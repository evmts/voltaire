import * as OxBase64 from "ox/Base64";

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
	return OxBase64.toString(encoded);
}
