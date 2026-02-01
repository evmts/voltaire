/**
 * Create Signature from DER-encoded ECDSA signature
 *
 * @param {Uint8Array} der - DER-encoded signature
 * @param {import('./SignatureType.js').SignatureAlgorithm} algorithm - Algorithm (secp256k1 or p256)
 * @param {number} [v] - Optional recovery ID for secp256k1
 * @returns {import('./SignatureType.js').SignatureType} Signature
 * @throws {InvalidDERError} If DER encoding is invalid
 *
 * @example
 * ```typescript
 * const sig = Signature.fromDER(derBytes, 'secp256k1', 27);
 * ```
 */
export function fromDER(der: Uint8Array, algorithm: import("./SignatureType.js").SignatureAlgorithm, v?: number): import("./SignatureType.js").SignatureType;
//# sourceMappingURL=fromDER.d.ts.map