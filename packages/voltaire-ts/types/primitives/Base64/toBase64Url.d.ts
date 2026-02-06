/**
 * Convert BrandedBase64 to BrandedBase64Url
 *
 * @param {import('./Base64Type.js').BrandedBase64} value - Base64 string
 * @returns {import('./BrandedBase64Url.js').BrandedBase64Url} Base64Url string
 *
 * @example
 * ```typescript
 * const b64 = Base64.from("SGVsbG8=");
 * const b64url = Base64.toBase64Url(b64);
 * // "SGVsbG8" (no padding, URL-safe)
 * ```
 */
export function toBase64Url(value: import("./Base64Type.js").BrandedBase64): import("./BrandedBase64Url.js").BrandedBase64Url;
//# sourceMappingURL=toBase64Url.d.ts.map