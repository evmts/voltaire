/**
 * Convert Signature to compact format (EIP-2098: yParity encoded in bit 255 of s)
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to convert
 * @returns {Uint8Array} Compact signature (64 bytes with yParity in bit 255 of s)
 *
 * @example
 * ```typescript
 * const compact = Signature.toCompact(sig);
 * // Returns r + s (64 bytes) with yParity encoded in bit 255 of s (EIP-2098)
 * ```
 */
export function toCompact(signature: import("./SignatureType.js").SignatureType): Uint8Array;
//# sourceMappingURL=toCompact.d.ts.map