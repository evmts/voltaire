/**
 * Encrypt data with AES-GCM
 *
 * **SECURITY WARNING: NEVER reuse a nonce with the same key.**
 * Nonce reuse completely breaks AES-GCM security, allowing attackers to:
 * - Recover XOR of plaintexts
 * - Recover the authentication key
 * - Forge arbitrary valid ciphertexts
 *
 * Always use `AesGcm.generateNonce()` to create a fresh random nonce for each
 * encryption operation. The nonce can be stored alongside the ciphertext
 * (it does not need to be secret, only unique).
 *
 * @see https://voltaire.tevm.sh/crypto/aesgcm/security for security best practices
 * @since 0.0.0
 * @param {Uint8Array} plaintext - Data to encrypt
 * @param {CryptoKey} key - AES key (128 or 256 bit)
 * @param {Uint8Array} nonce - 12-byte nonce (IV). MUST be unique per encryption with same key.
 *   Use `AesGcm.generateNonce()` to generate a cryptographically secure random nonce.
 * @param {Uint8Array} [additionalData] - Optional additional authenticated data
 * @returns {Promise<Uint8Array>} Ciphertext with authentication tag appended
 * @throws {InvalidNonceError} If nonce is not 12 bytes
 * @throws {AesGcmError} If encryption fails
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const plaintext = new TextEncoder().encode('Secret message');
 * const key = await AesGcm.generateKey(256);
 * // IMPORTANT: Generate a fresh nonce for EVERY encryption
 * const nonce = AesGcm.generateNonce();
 * const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
 * // Store nonce with ciphertext for decryption
 * ```
 */
export function encrypt(plaintext: Uint8Array, key: CryptoKey, nonce: Uint8Array, additionalData?: Uint8Array): Promise<Uint8Array>;
//# sourceMappingURL=encrypt.d.ts.map