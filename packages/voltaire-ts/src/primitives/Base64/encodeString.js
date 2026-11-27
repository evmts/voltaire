import { encode } from "./encode.js";

const textEncoder = new TextEncoder();

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
	return encode(textEncoder.encode(str));
}
