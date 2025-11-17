/**
 * Convert BrandedBase64Url to plain string (strip branding)
 *
 * @param {import('./BrandedBase64Url.js').BrandedBase64Url} value - Base64Url string
 * @returns {string} Plain string
 *
 * @example
 * ```typescript
 * const b64url = Base64.fromUrlSafe("SGVsbG8");
 * const str = Base64.toStringUrlSafe(b64url);
 * // "SGVsbG8" (plain string)
 * ```
 */
export function toStringUrlSafe(value) {
	return value;
}
