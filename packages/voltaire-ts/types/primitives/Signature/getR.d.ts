/**
 * Get r component from ECDSA signature
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature
 * @returns {import('../Hash/index.js').HashType} r component (32 bytes, HashType)
 * @throws {InvalidAlgorithmError} If signature is not ECDSA
 *
 * @example
 * ```typescript
 * const r = Signature.getR(sig);
 * ```
 */
export function getR(signature: import("./SignatureType.js").SignatureType): import("../Hash/index.js").HashType;
//# sourceMappingURL=getR.d.ts.map