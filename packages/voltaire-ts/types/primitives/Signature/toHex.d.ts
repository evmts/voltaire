/**
 * Convert Signature to hex string
 *
 * Formats:
 * - ECDSA without v: 128 hex chars (64 bytes: r + s)
 * - ECDSA with v: 130 hex chars (65 bytes: r + s + v)
 * - Ed25519: 128 hex chars (64 bytes)
 *
 * @param {import('./SignatureType.js').SignatureType} signature - Signature to convert
 * @param {boolean} [includeV=true] - Include v byte for secp256k1 (if present)
 * @returns {import('../Hex/HexType.js').HexType} Hex string with 0x prefix
 *
 * @example
 * ```typescript
 * const hex = Signature.toHex(sig);
 * // Returns "0x..." (130 chars with v, 128 chars without)
 *
 * // Exclude v even if present
 * const hexNoV = Signature.toHex(sig, false);
 * // Returns "0x..." (128 chars)
 * ```
 */
export function toHex(signature: import("./SignatureType.js").SignatureType, includeV?: boolean): import("../Hex/HexType.js").HexType;
//# sourceMappingURL=toHex.d.ts.map