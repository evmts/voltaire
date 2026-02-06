/**
 * Create Signature from P-256 ECDSA signature
 *
 * @param {Uint8Array} r - r component (32 bytes)
 * @param {Uint8Array} s - s component (32 bytes)
 * @returns {import('./SignatureType.js').SignatureType} Signature
 *
 * @example
 * ```typescript
 * const sig = Signature.fromP256(rBytes, sBytes);
 * ```
 */
export function fromP256(r: Uint8Array, s: Uint8Array): import("./SignatureType.js").SignatureType;
//# sourceMappingURL=fromP256.d.ts.map