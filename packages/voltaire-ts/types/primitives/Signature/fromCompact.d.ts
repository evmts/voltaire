/**
 * Create Signature from compact format (EIP-2098: supports yParity in bit 255 of s)
 *
 * @param {Uint8Array} bytes - Compact signature bytes (64 or 65 bytes)
 * @param {import('./SignatureType.js').SignatureAlgorithm | number} algorithmOrV - Algorithm or explicit v value
 * @returns {import('./SignatureType.js').SignatureType} Signature
 * @throws {InvalidSignatureLengthError} If bytes length is invalid
 *
 * @example
 * ```typescript
 * // EIP-2098: Extract yParity from bit 255 of s (64 bytes)
 * const sig1 = Signature.fromCompact(bytes64, 'secp256k1');
 *
 * // Explicit v value (64 bytes)
 * const sig2 = Signature.fromCompact(bytes64, 0);
 *
 * // Legacy: 65 bytes with v at end
 * const sig3 = Signature.fromCompact(bytes65, 'secp256k1');
 *
 * // Ed25519 (64 bytes)
 * const sig4 = Signature.fromCompact(bytes64, 'ed25519');
 * ```
 */
export function fromCompact(bytes: Uint8Array, algorithmOrV: import("./SignatureType.js").SignatureAlgorithm | number): import("./SignatureType.js").SignatureType;
//# sourceMappingURL=fromCompact.d.ts.map