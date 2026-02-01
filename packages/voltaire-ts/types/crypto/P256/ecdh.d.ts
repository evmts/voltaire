/**
 * Perform ECDH key exchange
 *
 * Computes shared secret from your private key and their public key.
 * Returns the x-coordinate of the shared point.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./P256PrivateKeyType.js').P256PrivateKeyType} privateKey - Your 32-byte private key
 * @param {import('./P256PublicKeyType.js').P256PublicKeyType} publicKey - Their 64-byte uncompressed public key
 * @returns {Uint8Array} 32-byte shared secret
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {InvalidPublicKeyError} If public key is invalid
 * @throws {P256Error} If ECDH computation fails
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * const myPrivateKey = new Uint8Array(32);
 * const theirPublicKey = P256.derivePublicKey(theirPrivateKey);
 * const sharedSecret = P256.ecdh(myPrivateKey, theirPublicKey);
 * ```
 */
export function ecdh(privateKey: import("./P256PrivateKeyType.js").P256PrivateKeyType, publicKey: import("./P256PublicKeyType.js").P256PublicKeyType): Uint8Array;
//# sourceMappingURL=ecdh.d.ts.map