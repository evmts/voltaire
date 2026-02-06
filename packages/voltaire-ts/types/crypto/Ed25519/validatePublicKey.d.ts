/**
 * Validate Ed25519 public key format and curve membership.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./PublicKey.js').PublicKey} publicKey - Ed25519 public key to validate
 * @returns {boolean} True if public key is valid and on curve, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * const isValid = Ed25519.validatePublicKey(publicKey);
 * if (!isValid) console.log('Invalid public key');
 * ```
 */
export function validatePublicKey(publicKey: import("./PublicKey.js").PublicKey): boolean;
//# sourceMappingURL=validatePublicKey.d.ts.map