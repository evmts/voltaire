/**
 * Check if two signatures are equal using constant-time comparison
 *
 * Uses constant-time comparison to prevent timing attacks when comparing
 * signature data. The algorithm and v value comparisons are also timing-safe
 * as they branch on fixed, public metadata.
 *
 * @param {import('./SignatureType.js').SignatureType} a - First signature
 * @param {import('./SignatureType.js').SignatureType} b - Second signature
 * @returns {boolean} True if signatures are equal
 *
 * @example
 * ```typescript
 * const isEqual = Signature.equals(sig1, sig2);
 * ```
 */
export function equals(a: import("./SignatureType.js").SignatureType, b: import("./SignatureType.js").SignatureType): boolean;
//# sourceMappingURL=equals.d.ts.map