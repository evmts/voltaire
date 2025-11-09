import * as OxBase64 from "ox/Base64";

/**
 * Encode string to base64
 *
 * @param {string} str - String to encode (UTF-8)
 * @returns {string} Base64-encoded string
 *
 * @example
 * ```typescript
 * const encoded = Base64.encodeString('Hello, world!');
 * ```
 */
export function encodeString(str) {
	return OxBase64.fromString(str);
}
