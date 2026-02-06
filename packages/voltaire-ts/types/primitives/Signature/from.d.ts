/**
 * Create Signature from various input types (universal constructor)
 *
 * @param {Uint8Array | { r: Uint8Array; s: Uint8Array; v?: number; algorithm?: import('./SignatureType.js').SignatureAlgorithm } | { signature: Uint8Array; algorithm: 'ed25519' }} value - Signature data
 * @returns {import('./SignatureType.js').SignatureType} Signature
 * @throws {InvalidSignatureFormatError} If value format is unsupported or invalid
 * @throws {InvalidSignatureLengthError} If signature length is invalid
 *
 * @example
 * ```typescript
 * // From compact bytes (64 bytes, defaults to secp256k1)
 * const sig1 = Signature.from(bytes64);
 *
 * // From object with r, s, v
 * const sig2 = Signature.from({ r, s, v: 27, algorithm: 'secp256k1' });
 *
 * // From Ed25519
 * const sig3 = Signature.from({ signature: bytes64, algorithm: 'ed25519' });
 * ```
 */
export function from(value: Uint8Array | {
    r: Uint8Array;
    s: Uint8Array;
    v?: number;
    algorithm?: import("./SignatureType.js").SignatureAlgorithm;
} | {
    signature: Uint8Array;
    algorithm: "ed25519";
}): import("./SignatureType.js").SignatureType;
//# sourceMappingURL=from.d.ts.map