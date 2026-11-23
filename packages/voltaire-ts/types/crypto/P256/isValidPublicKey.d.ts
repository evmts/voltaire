/**
 * Check whether a P256 public key is valid
 *
 * Alias of {@link validatePublicKey}, named consistently with
 * `Secp256k1.isValidPublicKey`.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./P256PublicKeyType.js').P256PublicKeyType | Uint8Array} publicKey - Public key to validate
 * @returns {boolean} True if the key encodes a valid curve point, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * if (!P256.isValidPublicKey(publicKey)) throw new Error('invalid key');
 * ```
 */
export function isValidPublicKey(publicKey: import("./P256PublicKeyType.js").P256PublicKeyType | Uint8Array): boolean;
//# sourceMappingURL=isValidPublicKey.d.ts.map