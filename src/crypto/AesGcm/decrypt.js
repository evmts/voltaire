import { NONCE_SIZE, TAG_SIZE } from "./constants.js";
import { DecryptionError, InvalidNonceError } from "./errors.js";

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
 * @throws {DecryptionError} If authentication fails or decryption error
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const key = await AesGcm.generateKey(256);
 * const nonce = AesGcm.generateNonce();
 * const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
 * const message = new TextDecoder().decode(decrypted);
 * ```
 */
export async function decrypt(ciphertext, key, nonce, additionalData) {
	if (nonce.length !== NONCE_SIZE) {
		throw new InvalidNonceError(
			`Nonce must be ${NONCE_SIZE} bytes, got ${nonce.length}`,
		);
	}

	if (ciphertext.length < TAG_SIZE) {
		throw new DecryptionError(
			"Ciphertext too short to contain authentication tag",
		);
	}

	try {
		const plaintext = await crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv: nonce,
				additionalData,
				tagLength: TAG_SIZE * 8,
			},
			key,
			ciphertext,
		);

		return new Uint8Array(plaintext);
	} catch (error) {
		throw new DecryptionError(
			`Decryption failed (invalid key, nonce, or corrupted data): ${error}`,
		);
	}
}
