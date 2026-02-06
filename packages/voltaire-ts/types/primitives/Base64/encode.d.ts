/**
 * Encode bytes to standard base64 string
 *
 * Uses standard base64 alphabet (A-Z, a-z, 0-9, +, /)
 * with padding (=)
 *
 * @param {Uint8Array} data - Bytes to encode
 * @returns {import('./Base64Type.js').BrandedBase64} Base64-encoded string
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([72, 101, 108, 108, 111]);
 * const encoded = Base64.encode(data);
 * // "SGVsbG8="
 * ```
 */
export function encode(data: Uint8Array): import("./Base64Type.js").BrandedBase64;
//# sourceMappingURL=encode.d.ts.map