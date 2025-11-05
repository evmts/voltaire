import { NONCE_SIZE, TAG_SIZE } from "./constants.js";
import { AesGcmError, InvalidNonceError } from "./errors.js";

/**
 * Encrypt data with AES-GCM
 *
 * @param {Uint8Array} plaintext - Data to encrypt
 * @param {CryptoKey} key - AES key (128 or 256 bit)
 * @param {Uint8Array} nonce - 12-byte nonce (IV)
 * @param {Uint8Array} [additionalData] - Optional additional authenticated data
 * @returns {Promise<Uint8Array>} Ciphertext with authentication tag appended
 *
 * @example
 * ```typescript
 * const plaintext = new TextEncoder().encode('Secret message');
 * const key = await generateKey(256);
 * const nonce = crypto.getRandomValues(new Uint8Array(12));
 * const ciphertext = await encrypt(plaintext, key, nonce);
 * ```
 */
export async function encrypt(plaintext, key, nonce, additionalData) {
	if (nonce.length !== NONCE_SIZE) {
		throw new InvalidNonceError(
			`Nonce must be ${NONCE_SIZE} bytes, got ${nonce.length}`,
		);
	}

	try {
		const ciphertext = await crypto.subtle.encrypt(
			{
				name: "AES-GCM",
				iv: nonce,
				additionalData,
				tagLength: TAG_SIZE * 8,
			},
			key,
			plaintext,
		);

		return new Uint8Array(ciphertext);
	} catch (error) {
		throw new AesGcmError(`Encryption failed: ${error}`);
	}
}
