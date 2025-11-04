import { InvalidKeyError } from "./errors.js";
import { AES128_KEY_SIZE, AES256_KEY_SIZE } from "./constants.js";

/**
 * Import raw key material as CryptoKey
 *
 * @param {Uint8Array} keyMaterial - 16-byte (128-bit) or 32-byte (256-bit) key
 * @returns {Promise<CryptoKey>} CryptoKey for use with WebCrypto API
 *
 * @example
 * ```typescript
 * const keyBytes = crypto.getRandomValues(new Uint8Array(32));
 * const key = await importKey(keyBytes);
 * ```
 */
export async function importKey(keyMaterial) {
	if (
		keyMaterial.length !== AES128_KEY_SIZE &&
		keyMaterial.length !== AES256_KEY_SIZE
	) {
		throw new InvalidKeyError(
			`Key must be ${AES128_KEY_SIZE} or ${AES256_KEY_SIZE} bytes, got ${keyMaterial.length}`,
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
		throw new InvalidKeyError(`Key import failed: ${error}`);
	}
}
