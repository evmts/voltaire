/**
 * Create Signature from secp256k1 ECDSA signature
 *
 * @param {Uint8Array} r - r component (32 bytes)
 * @param {Uint8Array} s - s component (32 bytes)
 * @param {number} [v] - Optional recovery ID (27 or 28 for Ethereum)
 * @returns {import('./SignatureType.js').SignatureType} Signature
 *
 * @example
 * ```typescript
 * const sig = Signature.fromSecp256k1(rBytes, sBytes, 27);
 * ```
 */
export function fromSecp256k1(r: Uint8Array, s: Uint8Array, v?: number): import("./SignatureType.js").SignatureType;
//# sourceMappingURL=fromSecp256k1.d.ts.map