import * as OxBase64 from "ox/Base64";

/**
 * Encode bytes to URL-safe base64 string
 *
 * Uses URL-safe alphabet (A-Z, a-z, 0-9, -, _)
 * without padding
 *
 * @param {Uint8Array} data - Bytes to encode
 * @returns {import('./BrandedBase64Url.js').BrandedBase64Url} URL-safe base64 string
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([255, 254, 253]);
 * const encoded = Base64.encodeUrlSafe(data);
 * // No padding, uses - and _ instead of + and /
 * ```
 */
export function encodeUrlSafe(data) {
	return OxBase64.fromBytes(data, { url: true }).replace(/=/g, "");
}
