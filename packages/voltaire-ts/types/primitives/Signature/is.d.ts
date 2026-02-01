/**
 * Check if value is a SignatureType
 *
 * @param {unknown} value - Value to check
 * @returns {value is import('./SignatureType.js').SignatureType} True if value is a SignatureType
 *
 * @example
 * ```typescript
 * if (Signature.is(value)) {
 *   console.log(value.algorithm);
 * }
 * ```
 */
export function is(value: unknown): value is import("./SignatureType.js").SignatureType;
//# sourceMappingURL=is.d.ts.map