/**
 * Create Signature from Ed25519 signature
 *
 * @param {Uint8Array} signature - Ed25519 signature (64 bytes)
 * @returns {import('./SignatureType.js').SignatureType} Signature
 * @throws {InvalidSignatureLengthError} If signature is not 64 bytes
 *
 * @example
 * ```typescript
 * const sig = Signature.fromEd25519(signature);
 * ```
 */
export function fromEd25519(signature: Uint8Array): import("./SignatureType.js").SignatureType;
//# sourceMappingURL=fromEd25519.d.ts.map