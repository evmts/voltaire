/**
 * Decrypt data with AES-GCM
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} ciphertext - Encrypted data with authentication tag
 * @param {CryptoKey} key - AES key (128 or 256 bit)
 * @param {Uint8Array} nonce - 12-byte nonce (IV) used during encryption
 * @param {Uint8Array} [additionalData] - Optional additional authenticated data
 * @returns {Promise<Uint8Array>} Decrypted plaintext
 * @throws {InvalidNonceError} If nonce is not 12 bytes
 * @throws {DecryptionError} If authentication fails, ciphertext too short, or decryption error
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const key = await AesGcm.generateKey(256);
 * const nonce = AesGcm.generateNonce();
 * const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
 * const message = new TextDecoder().decode(decrypted);
 * ```
 */
export function decrypt(ciphertext: Uint8Array, key: CryptoKey, nonce: Uint8Array, additionalData?: Uint8Array): Promise<Uint8Array>;
//# sourceMappingURL=decrypt.d.ts.map