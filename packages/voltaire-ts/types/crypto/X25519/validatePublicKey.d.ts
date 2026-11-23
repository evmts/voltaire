/**
 * Validate a public key
 *
 * A key is valid when it is 32 bytes and is not a low-order point (see
 * {@link isWeakPublicKey}). Low-order points force the shared secret to all
 * zeros regardless of the secret key, which lets an attacker dictate the
 * session key (RFC 7748 section 6.1).
 *
 * Non-canonical encodings (u >= p) that do not alias a low-order point stay
 * valid: RFC 7748 section 5 requires implementations to accept and reduce
 * them.
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
 * const valid = X25519.validatePublicKey(publicKey); // false: low-order point
 * ```
 */
export function validatePublicKey(publicKey: import("./PublicKey.js").PublicKey): boolean;
//# sourceMappingURL=validatePublicKey.d.ts.map