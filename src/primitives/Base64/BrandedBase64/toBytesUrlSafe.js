import { decodeUrlSafe } from "./decodeUrlSafe.js";

/**
 * Convert BrandedBase64Url to bytes
 *
 * @param {import('./BrandedBase64Url.js').BrandedBase64Url} value - Base64Url string
 * @returns {Uint8Array} Decoded bytes
 *
 * @example
 * ```typescript
 * const b64url = Base64.fromUrlSafe("SGVsbG8");
 * const bytes = Base64.toBytesUrlSafe(b64url);
 * // Uint8Array([72, 101, 108, 108, 111])
 * ```
 */
export function toBytesUrlSafe(value) {
	return decodeUrlSafe(value);
}
