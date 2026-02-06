/**
 * Convert input to BrandedBase64Url
 *
 * @param {import('./BrandedBase64Url.js').Base64UrlLike} value - Input to convert
 * @returns {import('./BrandedBase64Url.js').BrandedBase64Url} Branded Base64Url string
 * @throws {TypeError} If input cannot be converted to valid Base64Url
 *
 * @example
 * ```typescript
 * // From string
 * const b64url = Base64.fromUrlSafe("SGVsbG8");
 *
 * // From bytes
 * const data = new Uint8Array([1, 2, 3]);
 * const b64url = Base64.fromUrlSafe(data);
 * ```
 */
export function fromUrlSafe(value: import("./BrandedBase64Url.js").Base64UrlLike): import("./BrandedBase64Url.js").BrandedBase64Url;
//# sourceMappingURL=fromUrlSafe.d.ts.map