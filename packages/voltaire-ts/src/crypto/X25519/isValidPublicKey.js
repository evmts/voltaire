import { validatePublicKey } from "./validatePublicKey.js";

/**
 * Check whether an X25519 public key is valid
 *
 * Alias of {@link validatePublicKey}, named consistently with
 * `Secp256k1.isValidPublicKey`.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./PublicKey.js').PublicKey} publicKey - Public key to validate
 * @returns {boolean} True if valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * if (!X25519.isValidPublicKey(publicKey)) throw new Error('weak key');
 * ```
 */
export function isValidPublicKey(publicKey) {
	return validatePublicKey(publicKey);
}
