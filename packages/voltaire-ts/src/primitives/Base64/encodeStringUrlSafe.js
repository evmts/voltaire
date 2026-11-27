import { encodeUrlSafe } from "./encodeUrlSafe.js";

const textEncoder = new TextEncoder();

/**
 * Encode string to URL-safe base64
 *
 * @param {string} str - String to encode (UTF-8)
 * @returns {import('./BrandedBase64Url.js').BrandedBase64Url} URL-safe base64 string
 */
export function encodeStringUrlSafe(str) {
	return encodeUrlSafe(textEncoder.encode(str));
}
