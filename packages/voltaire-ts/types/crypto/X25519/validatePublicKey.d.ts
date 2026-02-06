/**
 * Validate a public key
 *
 * Checks if the public key has correct length
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./PublicKey.js').PublicKey} publicKey - Public key to validate
 * @returns {boolean} True if valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const publicKey = new Uint8Array(32);
 * const valid = X25519.validatePublicKey(publicKey);
 * ```
 */
export function validatePublicKey(publicKey: import("./PublicKey.js").PublicKey): boolean;
//# sourceMappingURL=validatePublicKey.d.ts.map