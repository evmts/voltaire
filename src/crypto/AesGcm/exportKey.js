import { InvalidKeyError } from "./errors.js";

/**
 * Export CryptoKey to raw bytes
 *
 * @param {CryptoKey} key - CryptoKey to export
 * @returns {Promise<Uint8Array>} Raw key bytes
 *
 * @example
 * ```typescript
 * const key = await generateKey(256);
 * const keyBytes = await exportKey(key);
 * ```
 */
export async function exportKey(key) {
	try {
		const exported = await crypto.subtle.exportKey("raw", key);
		return new Uint8Array(exported);
	} catch (error) {
		throw new InvalidKeyError(`Key export failed: ${error}`);
	}
}
