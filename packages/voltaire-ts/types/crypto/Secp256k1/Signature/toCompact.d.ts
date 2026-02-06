/**
 * Convert signature to EIP-2098 compact format (64 bytes: r || s with yParity in bit 255)
 *
 * EIP-2098 encodes the recovery parameter (yParity) into the highest bit of s,
 * allowing signatures to be represented in 64 bytes instead of 65.
 *
 * @see https://eips.ethereum.org/EIPS/eip-2098
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../SignatureType.js').Secp256k1SignatureType} signature - ECDSA signature
 * @returns {Uint8Array} 64-byte EIP-2098 compact signature
 * @throws {never}
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * const compact = Secp256k1.Signature.toCompact(signature);
 * console.log(compact.length); // 64
 * // yParity is encoded in bit 255 of s
 * ```
 */
export function toCompact(signature: import("../SignatureType.js").Secp256k1SignatureType): Uint8Array;
//# sourceMappingURL=toCompact.d.ts.map