/**
 * Validate a public key
 *
 * Checks if the public key is a valid point on the P256 curve
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./P256PublicKeyType.js').P256PublicKeyType} publicKey - Public key to validate
 * @returns {boolean} True if valid, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as P256 from './crypto/P256/index.js';
 * const publicKey = new Uint8Array(64);
 * const isValid = P256.validatePublicKey(publicKey);
 * ```
 */
export function validatePublicKey(publicKey: import("./P256PublicKeyType.js").P256PublicKeyType): boolean;
//# sourceMappingURL=validatePublicKey.d.ts.map