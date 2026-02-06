/**
 * Get v (recovery ID) from secp256k1 signature
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature
 * @returns {number | undefined} Recovery ID (27 or 28) or undefined
 * @throws {InvalidAlgorithmError} If signature is not secp256k1
 *
 * @example
 * ```typescript
 * const v = Signature.getV(sig);
 * ```
 */
export function getV(signature: import("./SignatureType.js").SignatureType): number | undefined;
//# sourceMappingURL=getV.d.ts.map