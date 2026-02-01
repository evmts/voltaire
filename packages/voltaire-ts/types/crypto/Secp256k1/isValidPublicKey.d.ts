/**
 * Validate public key
 *
 * Checks that the public key is a valid point on the secp256k1 curve.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} publicKey - 64-byte uncompressed public key
 * @returns {publicKey is import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} true if public key is valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const publicKey = new Uint8Array(64);
 * if (Secp256k1.isValidPublicKey(publicKey)) {
 *   const branded = publicKey; // now Secp256k1PublicKeyType
 * }
 * ```
 */
export function isValidPublicKey(publicKey: Uint8Array): publicKey is import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType;
//# sourceMappingURL=isValidPublicKey.d.ts.map