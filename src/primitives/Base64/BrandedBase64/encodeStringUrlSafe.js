import { encodeUrlSafe } from "./encodeUrlSafe.js";

/**
 * Encode string to URL-safe base64
 *
 * @param {string} str - String to encode (UTF-8)
 * @returns {string} URL-safe base64 string
 */
export function encodeStringUrlSafe(str) {
	const encoder = new TextEncoder();
	return encodeUrlSafe(encoder.encode(str));
}
