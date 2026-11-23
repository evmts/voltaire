/**
 * Check whether an Ed25519 public key is valid
 *
 * Alias of {@link validatePublicKey}, named consistently with
 * `Secp256k1.isValidPublicKey`.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./PublicKey.js').PublicKey} publicKey - Ed25519 public key to validate
 * @returns {boolean} True if the key is a canonical, prime-order curve point, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * if (!Ed25519.isValidPublicKey(publicKey)) throw new Error('invalid key');
 * ```
 */
export function isValidPublicKey(publicKey: import("./PublicKey.js").PublicKey): boolean;
//# sourceMappingURL=isValidPublicKey.d.ts.map