/**
 * Convert input to BrandedBase64
 *
 * @param {import('./Base64Type.js').Base64Like} value - Input to convert
 * @returns {import('./Base64Type.js').BrandedBase64} Branded Base64 string
 * @throws {TypeError} If input cannot be converted to valid Base64
 *
 * @example
 * ```typescript
 * // From string
 * const b64 = Base64.from("SGVsbG8=");
 *
 * // From bytes
 * const data = new Uint8Array([1, 2, 3]);
 * const b64 = Base64.from(data);
 * ```
 */
export function from(value: import("./Base64Type.js").Base64Like): import("./Base64Type.js").BrandedBase64;
//# sourceMappingURL=from.d.ts.map