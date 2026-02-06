import { chacha20poly1305 } from "@noble/ciphers/chacha.js";
import { KEY_SIZE, NONCE_SIZE, TAG_SIZE } from "./constants.js";
import { DecryptionError, InvalidKeyError, InvalidNonceError, } from "./errors.js";
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
export function decrypt(ciphertext, key, nonce, additionalData) {
    if (key.length !== KEY_SIZE) {
        throw new InvalidKeyError(`Key must be ${KEY_SIZE} bytes, got ${key.length}`);
    }
    if (nonce.length !== NONCE_SIZE) {
        throw new InvalidNonceError(`Nonce must be ${NONCE_SIZE} bytes, got ${nonce.length}`);
    }
    if (ciphertext.length < TAG_SIZE) {
        throw new DecryptionError("Ciphertext too short to contain authentication tag");
    }
    try {
        const cipher = chacha20poly1305(key, nonce, additionalData);
        return cipher.decrypt(ciphertext);
    }
    catch (error) {
        throw new DecryptionError(`Decryption failed (invalid key, nonce, or corrupted data): ${error}`);
    }
}
