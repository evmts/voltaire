/**
 * Derive Ed25519 public key from secret key.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SecretKey.js').SecretKey} secretKey - 32-byte Ed25519 secret key (seed)
 * @returns {import('./PublicKey.js').PublicKey} 32-byte Ed25519 public key
 * @throws {InvalidSecretKeyError} If secret key length is invalid or derivation fails
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * const secretKey = new Uint8Array(32); // Your secret key
 * const publicKey = Ed25519.derivePublicKey(secretKey);
 * ```
 */
export function derivePublicKey(secretKey: import("./SecretKey.js").SecretKey): import("./PublicKey.js").PublicKey;
//# sourceMappingURL=derivePublicKey.d.ts.map