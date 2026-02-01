/**
 * Normalize ECDSA signature to canonical form (s = n - s if s > n/2)
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to normalize
 * @returns {import('./SignatureType.js').SignatureType} Normalized signature
 *
 * @example
 * ```typescript
 * const normalized = Signature.normalize(sig);
 * ```
 */
export function normalize(signature: import("./SignatureType.js").SignatureType): import("./SignatureType.js").SignatureType;
//# sourceMappingURL=normalize.d.ts.map