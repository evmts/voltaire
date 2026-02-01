/**
 * Convert BrandedBase64 to bytes
 *
 * @param {import('./Base64Type.js').BrandedBase64} value - Base64 string
 * @returns {Uint8Array} Decoded bytes
 *
 * @example
 * ```typescript
 * const b64 = Base64.from("SGVsbG8=");
 * const bytes = Base64.toBytes(b64);
 * // Uint8Array([72, 101, 108, 108, 111])
 * ```
 */
export function toBytes(value: import("./Base64Type.js").BrandedBase64): Uint8Array;
//# sourceMappingURL=toBytes.d.ts.map