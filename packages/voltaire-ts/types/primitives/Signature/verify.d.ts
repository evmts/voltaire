/**
 * Verify signature against message hash and public key
 *
 * Dispatches to the appropriate crypto implementation based on signature algorithm.
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to verify
 * @param {Uint8Array} messageHash - 32-byte message hash that was signed
 * @param {Uint8Array} publicKey - Public key to verify against (64 bytes for ECDSA)
 * @returns {boolean} True if signature is valid, false otherwise
 * @throws {InvalidAlgorithmError} If algorithm is not supported
 *
 * @example
 * ```typescript
 * const isValid = Signature.verify(sig, messageHash, publicKey);
 * ```
 */
export function verify(signature: import("./SignatureType.js").SignatureType, messageHash: Uint8Array, publicKey: Uint8Array): boolean;
//# sourceMappingURL=verify.d.ts.map