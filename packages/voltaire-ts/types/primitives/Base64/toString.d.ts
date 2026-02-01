/**
 * Convert BrandedBase64 to plain string (strip branding)
 *
 * @param {import('./Base64Type.js').BrandedBase64} value - Base64 string
 * @returns {string} Plain string
 *
 * @example
 * ```typescript
 * const b64 = Base64.from("SGVsbG8=");
 * const str = Base64.toString(b64);
 * // "SGVsbG8=" (plain string)
 * ```
 */
export function toString(value: import("./Base64Type.js").BrandedBase64): string;
//# sourceMappingURL=toString.d.ts.map