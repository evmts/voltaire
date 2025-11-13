import { decode } from "./decode.js";
import { encodeUrlSafe } from "./encodeUrlSafe.js";

/**
 * Convert BrandedBase64 to BrandedBase64Url
 *
 * @param {import('./BrandedBase64.js').BrandedBase64} value - Base64 string
 * @returns {import('./BrandedBase64Url.js').BrandedBase64Url} Base64Url string
 *
 * @example
 * ```typescript
 * const b64 = Base64.from("SGVsbG8=");
 * const b64url = Base64.toBase64Url(b64);
 * // "SGVsbG8" (no padding, URL-safe)
 * ```
 */
export function toBase64Url(value) {
	const bytes = decode(value);
	return encodeUrlSafe(bytes);
}
