import { SECRET_KEY_SIZE } from "./constants.js";

/**
 * Generate random secret key
 *
 * Uses crypto.getRandomValues for secure random generation
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @returns {import('./SecretKey.js').SecretKey} 32-byte random secret key
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const secretKey = X25519.generateSecretKey();
 * const publicKey = X25519.derivePublicKey(secretKey);
 * console.log(secretKey.length); // 32
 * ```
 */
export function generateSecretKey() {
	return crypto.getRandomValues(new Uint8Array(SECRET_KEY_SIZE));
}
