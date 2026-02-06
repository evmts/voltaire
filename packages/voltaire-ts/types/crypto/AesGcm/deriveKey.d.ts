/**
 * Derive key from password using PBKDF2
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string | Uint8Array} password - Password string or bytes
 * @param {Uint8Array} salt - Salt for key derivation (at least 16 bytes recommended)
 * @param {number} iterations - Number of iterations (at least 100000 recommended)
 * @param {128 | 256} bits - Key size in bits (128 or 256)
 * @returns {Promise<CryptoKey>} Derived CryptoKey
 * @throws {AesGcmError} If key derivation fails
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const salt = crypto.getRandomValues(new Uint8Array(16));
 * const key = await AesGcm.deriveKey('mypassword', salt, 100000, 256);
 * ```
 */
export function deriveKey(password: string | Uint8Array, salt: Uint8Array, iterations: number, bits: 128 | 256): Promise<CryptoKey>;
//# sourceMappingURL=deriveKey.d.ts.map