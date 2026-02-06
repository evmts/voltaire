/**
 * Validate Ed25519 secret key format.
 *
 * Checks length and attempts public key derivation.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./SecretKey.js').SecretKey} secretKey - Ed25519 secret key to validate
 * @returns {boolean} True if secret key is valid (32 bytes and can derive public key), false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * const isValid = Ed25519.validateSecretKey(secretKey);
 * if (!isValid) console.log('Invalid secret key');
 * ```
 */
export function validateSecretKey(secretKey: import("./SecretKey.js").SecretKey): boolean;
//# sourceMappingURL=validateSecretKey.d.ts.map