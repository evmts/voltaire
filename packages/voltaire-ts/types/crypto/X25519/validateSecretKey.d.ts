/**
 * Validate a secret key
 *
 * Checks if the secret key has correct length and can derive a public key
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SecretKey.js').SecretKey} secretKey - Secret key to validate
 * @returns {boolean} True if valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const secretKey = new Uint8Array(32);
 * const valid = X25519.validateSecretKey(secretKey);
 * ```
 */
export function validateSecretKey(secretKey: import("./SecretKey.js").SecretKey): boolean;
//# sourceMappingURL=validateSecretKey.d.ts.map