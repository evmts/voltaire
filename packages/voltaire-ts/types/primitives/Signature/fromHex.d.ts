/**
 * Create Signature from hex string
 *
 * Formats supported:
 * - 128 hex chars (64 bytes): ECDSA r+s or Ed25519 signature
 * - 130 hex chars (65 bytes): ECDSA r+s+v
 *
 * @param {string} value - Hex string (with or without 0x prefix)
 * @param {import('./SignatureType.js').SignatureAlgorithm} [algorithm='secp256k1'] - Signature algorithm
 * @returns {import('./SignatureType.js').SignatureType} Signature
 * @throws {InvalidSignatureFormatError} If value is not a string
 * @throws {InvalidSignatureLengthError} If hex length is invalid
 *
 * @example
 * ```typescript
 * // 128 hex chars (64 bytes) - defaults to secp256k1
 * const sig1 = Signature.fromHex("0x1234...");
 *
 * // 130 hex chars (65 bytes) - includes v
 * const sig2 = Signature.fromHex("0x1234...ab");
 *
 * // Ed25519 (128 hex chars)
 * const sig3 = Signature.fromHex("0x1234...", "ed25519");
 *
 * // P256 (128 hex chars)
 * const sig4 = Signature.fromHex("0x1234...", "p256");
 * ```
 */
export function fromHex(value: string, algorithm?: import("./SignatureType.js").SignatureAlgorithm): import("./SignatureType.js").SignatureType;
//# sourceMappingURL=fromHex.d.ts.map