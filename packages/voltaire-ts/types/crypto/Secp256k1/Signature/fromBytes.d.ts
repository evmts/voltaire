/**
 * Create signature from bytes with v appended (65 bytes: r || s || v)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 65-byte signature
 * @returns {import('../SignatureType.js').Secp256k1SignatureType} ECDSA signature
 * @throws {InvalidSignatureError} If bytes is wrong length
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * const bytes = new Uint8Array(65);
 * const signature = Secp256k1.Signature.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("../SignatureType.js").Secp256k1SignatureType;
//# sourceMappingURL=fromBytes.d.ts.map