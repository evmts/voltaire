/**
 * Convert BrandedBase64 to plain string (strip branding)
 *
 * @param {import('./BrandedBase64.js').BrandedBase64} value - Base64 string
 * @returns {string} Plain string
 *
 * @example
 * ```typescript
 * const b64 = Base64.from("SGVsbG8=");
 * const str = Base64.toString(b64);
 * // "SGVsbG8=" (plain string)
 * ```
 */
export function toString(value) {
	return value;
}
