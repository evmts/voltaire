/**
 * Convert ECDSA signature to DER encoding
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to convert
 * @returns {Uint8Array} DER-encoded signature
 * @throws {InvalidAlgorithmError} If signature is not ECDSA (secp256k1 or p256)
 *
 * @example
 * ```typescript
 * const der = Signature.toDER(sig);
 * // Returns DER-encoded SEQUENCE of r and s integers
 * ```
 */
export function toDER(signature: import("./SignatureType.js").SignatureType): Uint8Array;
//# sourceMappingURL=toDER.d.ts.map