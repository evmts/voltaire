/**
 * Get the algorithm of a signature
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to check
 * @returns {import('./SignatureType.js').SignatureAlgorithm} Signature algorithm
 *
 * @example
 * ```typescript
 * const algorithm = Signature.getAlgorithm(sig);
 * // "secp256k1" | "p256" | "ed25519"
 * ```
 */
export function getAlgorithm(signature: import("./SignatureType.js").SignatureType): import("./SignatureType.js").SignatureAlgorithm;
//# sourceMappingURL=getAlgorithm.d.ts.map