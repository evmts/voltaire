/**
 * Perform X25519 scalar multiplication (ECDH)
 *
 * Computes shared secret from your secret key and their public key.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SecretKey.js').SecretKey} secretKey - Your 32-byte secret key
 * @param {import('./PublicKey.js').PublicKey} publicKey - Their 32-byte public key
 * @returns {import('./SharedSecret.js').SharedSecret} 32-byte shared secret
 * @throws {InvalidSecretKeyError} If secret key is invalid
 * @throws {InvalidPublicKeyError} If public key is invalid
 * @throws {X25519Error} If scalar multiplication fails
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const mySecret = crypto.getRandomValues(new Uint8Array(32));
 * const theirPublic = X25519.derivePublicKey(theirSecret);
 * const shared = X25519.scalarmult(mySecret, theirPublic);
 * console.log(shared.length); // 32
 * ```
 */
export function scalarmult(secretKey: import("./SecretKey.js").SecretKey, publicKey: import("./PublicKey.js").PublicKey): import("./SharedSecret.js").SharedSecret;
//# sourceMappingURL=scalarmult.d.ts.map