import { decodeUrlSafe } from "./decodeUrlSafe.js";
import { encode } from "./encode.js";

/**
 * Convert BrandedBase64Url to BrandedBase64
 *
 * @param {import('./BrandedBase64Url.js').BrandedBase64Url} value - Base64Url string
 * @returns {import('./BrandedBase64.js').BrandedBase64} Base64 string
 *
 * @example
 * ```typescript
 * const b64url = Base64.fromUrlSafe("SGVsbG8");
 * const b64 = Base64.toBase64(b64url);
 * // "SGVsbG8=" (with padding)
 * ```
 */
export function toBase64(value) {
	const bytes = decodeUrlSafe(value);
	return encode(bytes);
}
