/**
 * Derive public key from private key
 *
 * Computes the public key point from a private key using scalar
 * multiplication on the secp256k1 curve.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} privateKey - 32-byte private key
 * @returns {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} 64-byte uncompressed public key
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 * const privateKey = PrivateKey.from(new Uint8Array(32));
 * const publicKey = Secp256k1.derivePublicKey(privateKey);
 * console.log(publicKey.length); // 64
 * ```
 */
export function derivePublicKey(privateKey: import("../../primitives/PrivateKey/PrivateKeyType.js").PrivateKeyType): import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType;
//# sourceMappingURL=derivePublicKey.d.ts.map