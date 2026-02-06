/**
 * Perform ECDH key exchange
 *
 * Computes shared secret from your private key and their public key.
 * Returns the x-coordinate of the shared point (32 bytes).
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @see https://eips.ethereum.org/EIPS/eip-5564 for ERC-5564 stealth addresses
 * @since 0.0.0
 * @param {import('../../primitives/PrivateKey/PrivateKeyType.js').PrivateKeyType} privateKey - Your 32-byte private key
 * @param {import('./Secp256k1PublicKeyType.js').Secp256k1PublicKeyType} publicKey - Their 64-byte uncompressed public key
 * @returns {Uint8Array} 32-byte shared secret (x-coordinate)
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {InvalidPublicKeyError} If public key is invalid
 * @throws {Secp256k1Error} If ECDH computation fails
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * const myPrivateKey = new Uint8Array(32);
 * const theirPublicKey = Secp256k1.derivePublicKey(theirPrivateKey);
 * const sharedSecret = Secp256k1.ecdh(myPrivateKey, theirPublicKey);
 * console.log(sharedSecret.length); // 32
 * ```
 */
export function ecdh(privateKey: import("../../primitives/PrivateKey/PrivateKeyType.js").PrivateKeyType, publicKey: import("./Secp256k1PublicKeyType.js").Secp256k1PublicKeyType): Uint8Array;
//# sourceMappingURL=ecdh.d.ts.map