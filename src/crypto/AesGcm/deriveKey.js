import { AesGcmError } from "./errors.js";

/**
 * Derive key from password using PBKDF2
 *
 * @param {string | Uint8Array} password - Password string or bytes
 * @param {Uint8Array} salt - Salt for key derivation (at least 16 bytes recommended)
 * @param {number} iterations - Number of iterations (at least 100000 recommended)
 * @param {128 | 256} bits - Key size in bits (128 or 256)
 * @returns {Promise<CryptoKey>} Derived CryptoKey
 *
 * @example
 * ```typescript
 * const salt = crypto.getRandomValues(new Uint8Array(16));
 * const key = await deriveKey('mypassword', salt, 100000, 256);
 * ```
 */
export async function deriveKey(password, salt, iterations, bits) {
	try {
		const passwordBytes =
			typeof password === "string"
				? new TextEncoder().encode(password)
				: password;

		const baseKey = await crypto.subtle.importKey(
			"raw",
			passwordBytes,
			{ name: "PBKDF2" },
			false,
			["deriveBits", "deriveKey"],
		);

		return await crypto.subtle.deriveKey(
			{
				name: "PBKDF2",
				salt,
				iterations,
				hash: "SHA-256",
			},
			baseKey,
			{ name: "AES-GCM", length: bits },
			true,
			["encrypt", "decrypt"],
		);
	} catch (error) {
		throw new AesGcmError(`Key derivation failed: ${error}`);
	}
}
