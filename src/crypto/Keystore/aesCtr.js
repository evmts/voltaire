// @ts-nocheck
import { ctr } from "@noble/ciphers/aes.js";

/**
 * Encrypt data with AES-128-CTR
 *
 * @param {Uint8Array} data - Data to encrypt
 * @param {Uint8Array} key - 16-byte AES key
 * @param {Uint8Array} iv - 16-byte initialization vector
 * @returns {Uint8Array} Ciphertext
 */
export function encryptAesCtr(data, key, iv) {
	const cipher = ctr(key, iv);
	return cipher.encrypt(data);
}

/**
 * Decrypt data with AES-128-CTR
 *
 * @param {Uint8Array} ciphertext - Encrypted data
 * @param {Uint8Array} key - 16-byte AES key
 * @param {Uint8Array} iv - 16-byte initialization vector
 * @returns {Uint8Array} Plaintext
 */
export function decryptAesCtr(ciphertext, key, iv) {
	const cipher = ctr(key, iv);
	return cipher.decrypt(ciphertext);
}
