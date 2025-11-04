import { AesGcmError } from "./errors.js";

/**
 * Generate AES-GCM key
 *
 * @param {128 | 256} bits - Key size in bits (128 or 256)
 * @returns {Promise<CryptoKey>} CryptoKey for use with WebCrypto API
 *
 * @example
 * ```typescript
 * const key128 = await generateKey(128);
 * const key256 = await generateKey(256);
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
