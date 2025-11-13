import * as OxBase64 from "ox/Base64";

/**
 * Encode string to URL-safe base64
 *
 * @param {string} str - String to encode (UTF-8)
 * @returns {import('./BrandedBase64Url.js').BrandedBase64Url} URL-safe base64 string
 */
export function encodeStringUrlSafe(str) {
	return OxBase64.fromString(str, { url: true }).replace(/=/g, "");
}
