/**
 * Create a Secp256k1PublicKeyType from 64 raw bytes
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 64-byte uncompressed public key
 * @returns {import('../Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} Branded public key
 * @throws {InvalidPublicKeyError} If public key length is invalid or not a valid curve point
 * @example
 * ```javascript
 * import * as PublicKey from './crypto/Secp256k1/PublicKey/index.js';
 * const publicKey = PublicKey.fromBytes(keyBytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("../Secp256k1PublicKeyType.js").Secp256k1PublicKeyType;
//# sourceMappingURL=fromBytes.d.ts.map