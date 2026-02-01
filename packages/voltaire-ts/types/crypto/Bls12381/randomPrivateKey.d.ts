/**
 * Generate a random BLS12-381 private key
 *
 * Uses cryptographically secure random number generation.
 * The key is guaranteed to be valid (non-zero and less than curve order).
 *
 * @returns {Uint8Array} 32-byte private key
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const privateKey = Bls12381.randomPrivateKey();
 * const publicKey = Bls12381.derivePublicKey(privateKey);
 * ```
 */
export function randomPrivateKey(): Uint8Array;
/**
 * Check if a private key is valid
 *
 * A valid private key must be:
 * - 32 bytes
 * - Non-zero
 * - Less than the curve order (Fr modulus)
 *
 * @param {Uint8Array} privateKey - Private key to validate
 * @returns {boolean} True if valid
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const pk = Bls12381.randomPrivateKey();
 * console.log(Bls12381.isValidPrivateKey(pk)); // true
 *
 * const invalid = new Uint8Array(32); // all zeros
 * console.log(Bls12381.isValidPrivateKey(invalid)); // false
 * ```
 */
export function isValidPrivateKey(privateKey: Uint8Array): boolean;
//# sourceMappingURL=randomPrivateKey.d.ts.map