/**
 * Decrypt data with ChaCha20-Poly1305
 *
 * @see https://voltaire.tevm.sh/crypto/chacha20poly1305 for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} ciphertext - Encrypted data with authentication tag
 * @param {Uint8Array} key - 32-byte key (256 bits)
 * @param {Uint8Array} nonce - 12-byte nonce (96 bits) used during encryption
 * @param {Uint8Array} [additionalData] - Optional additional authenticated data
 * @returns {Uint8Array} Decrypted plaintext
 * @throws {InvalidKeyError} If key is not 32 bytes
 * @throws {InvalidNonceError} If nonce is not 12 bytes
 * @throws {DecryptionError} If authentication fails or decryption error
 * @example
 * ```javascript
 * import * as ChaCha20Poly1305 from './crypto/ChaCha20Poly1305/index.js';
 * const key = ChaCha20Poly1305.generateKey();
 * const nonce = ChaCha20Poly1305.generateNonce();
 * const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
 * const message = new TextDecoder().decode(decrypted);
 * ```
 */
export function decrypt(ciphertext: Uint8Array, key: Uint8Array, nonce: Uint8Array, additionalData?: Uint8Array): Uint8Array;
//# sourceMappingURL=decrypt.d.ts.map