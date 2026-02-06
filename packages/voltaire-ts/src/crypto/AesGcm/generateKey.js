import { AesGcmError } from "./errors.js";

/**
 * Generate AES-GCM key
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {128 | 256} bits - Key size in bits (128 or 256)
 * @returns {Promise<CryptoKey>} CryptoKey for use with WebCrypto API
 * @throws {AesGcmError} If key generation fails
 * @example
 * ```javascript
 * import * as AesGcm from './crypto/AesGcm/index.js';
 * const key128 = await AesGcm.generateKey(128);
 * const key256 = await AesGcm.generateKey(256);
 * ```
 */
export async function generateKey(bits) {
	try {
		return await crypto.subtle.generateKey(
			{
				name: "AES-GCM",
				length: bits,
			},
			true,
			["encrypt", "decrypt"],
		);
	} catch (error) {
		throw new AesGcmError(`Key generation failed: ${error}`);
	}
}
