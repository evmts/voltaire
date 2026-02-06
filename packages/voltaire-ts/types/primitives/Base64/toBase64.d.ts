/**
 * Convert BrandedBase64Url to BrandedBase64
 *
 * @param {import('./BrandedBase64Url.js').BrandedBase64Url} value - Base64Url string
 * @returns {import('./Base64Type.js').BrandedBase64} Base64 string
 *
 * @example
 * ```typescript
 * const b64url = Base64.fromUrlSafe("SGVsbG8");
 * const b64 = Base64.toBase64(b64url);
 * // "SGVsbG8=" (with padding)
 * ```
 */
export function toBase64(value: import("./BrandedBase64Url.js").BrandedBase64Url): import("./Base64Type.js").BrandedBase64;
//# sourceMappingURL=toBase64.d.ts.map