import { AES128_KEY_SIZE, AES256_KEY_SIZE } from "./constants.js";
import { InvalidKeyError } from "./errors.js";

/**
 * Import raw key material as CryptoKey
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} keyMaterial - 16-byte (128-bit) or 32-byte (256-bit) key
 * @returns {Promise<CryptoKey>} CryptoKey for use with WebCrypto API
 * @throws {InvalidKeyError} If key import fails or key size is invalid
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const keyBytes = crypto.getRandomValues(new Uint8Array(32));
 * const key = await AesGcm.importKey(keyBytes);
 * ```
 */
export async function importKey(keyMaterial) {
	if (
		keyMaterial.length !== AES128_KEY_SIZE &&
		keyMaterial.length !== AES256_KEY_SIZE
	) {
		throw new InvalidKeyError(
			`Key must be ${AES128_KEY_SIZE} or ${AES256_KEY_SIZE} bytes, got ${keyMaterial.length}`,
			{
				code: "AES_GCM_INVALID_KEY_SIZE",
				context: {
					length: keyMaterial.length,
					expected: `${AES128_KEY_SIZE} or ${AES256_KEY_SIZE}`,
				},
				docsPath: "/crypto/aes-gcm/import-key#error-handling",
			},
		);
	}

	try {
		return await crypto.subtle.importKey(
			"raw",
			keyMaterial,
			{ name: "AES-GCM" },
			true,
			["encrypt", "decrypt"],
		);
	} catch (error) {
		throw new InvalidKeyError(`Key import failed: ${error}`, {
			code: "AES_GCM_KEY_IMPORT_FAILED",
			context: { keyLength: keyMaterial.length },
			docsPath: "/crypto/aes-gcm/import-key#error-handling",
			cause: /** @type {Error} */ (error),
		});
	}
}
