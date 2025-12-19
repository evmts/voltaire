import { fromCompact } from "./fromCompact.js";

/**
 * Create Signature from raw bytes
 *
 * Wrapper around fromCompact with clearer semantics for byte input.
 *
 * Formats supported:
 * - 64 bytes: ECDSA r+s (with optional EIP-2098 yParity in bit 255) or Ed25519 signature
 * - 65 bytes: ECDSA r+s+v (secp256k1 only)
 *
 * @param {Uint8Array} bytes - Signature bytes
 * @param {import('./SignatureType.js').SignatureAlgorithm | number} [algorithmOrV='secp256k1'] - Algorithm or explicit v value
 * @returns {import('./SignatureType.js').SignatureType} Signature
 * @throws {InvalidSignatureLengthError} If bytes length is invalid
 *
 * @example
 * ```typescript
 * // 64 bytes - defaults to secp256k1
 * const sig1 = Signature.fromBytes(bytes64);
 *
 * // 65 bytes with v
 * const sig2 = Signature.fromBytes(bytes65);
 *
 * // Explicit algorithm
 * const sig3 = Signature.fromBytes(bytes64, 'ed25519');
 *
 * // Explicit v value (overrides EIP-2098 encoding)
 * const sig4 = Signature.fromBytes(bytes64, 0);
 * ```
 */
export function fromBytes(bytes, algorithmOrV = "secp256k1") {
	return fromCompact(bytes, algorithmOrV);
}
