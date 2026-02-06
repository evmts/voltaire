/**
 * Derive public key from secret key
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SecretKey.js').SecretKey} secretKey - 32-byte secret key
 * @returns {import('./PublicKey.js').PublicKey} 32-byte public key
 * @throws {InvalidSecretKeyError} If secret key is invalid
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const secretKey = crypto.getRandomValues(new Uint8Array(32));
 * const publicKey = X25519.derivePublicKey(secretKey);
 * console.log(publicKey.length); // 32
 * ```
 */
export function derivePublicKey(secretKey: import("./SecretKey.js").SecretKey): import("./PublicKey.js").PublicKey;
//# sourceMappingURL=derivePublicKey.d.ts.map