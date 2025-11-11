import { NONCE_SIZE, TAG_SIZE } from "./constants.js";
import { AesGcmError, InvalidNonceError } from "./errors.js";

/**
 * Encrypt data with AES-GCM
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} plaintext - Data to encrypt
 * @param {CryptoKey} key - AES key (128 or 256 bit)
 * @param {Uint8Array} nonce - 12-byte nonce (IV)
 * @param {Uint8Array} [additionalData] - Optional additional authenticated data
 * @returns {Promise<Uint8Array>} Ciphertext with authentication tag appended
 * @throws {AesGcmError} If encryption fails
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const plaintext = new TextEncoder().encode('Secret message');
 * const key = await AesGcm.generateKey(256);
 * const nonce = AesGcm.generateNonce();
 * const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
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
