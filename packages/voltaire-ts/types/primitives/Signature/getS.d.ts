/**
 * Get s component from ECDSA signature
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature
 * @returns {import('../Hash/index.js').HashType} s component (32 bytes, HashType)
 * @throws {InvalidAlgorithmError} If signature is not ECDSA
 *
 * @example
 * ```typescript
 * const s = Signature.getS(sig);
 * ```
 */
export function getS(signature: import("./SignatureType.js").SignatureType): import("../Hash/index.js").HashType;
//# sourceMappingURL=getS.d.ts.map